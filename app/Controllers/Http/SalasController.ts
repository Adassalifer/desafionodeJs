import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Sala from 'App/Models/Sala';
import Professor from 'App/Models/Professor';
import Aluno from 'App/Models/Aluno';

export default class SalasController {
  public async index({}: HttpContextContract) {
    const salas = await Sala.query().preload('alunos').preload('professores');
    return salas;
  }

  public async obterDadosSala({ params }: HttpContextContract) {
    try {
      const numero_sala = params.numero_sala;
      const sala = await Sala.findBy('numero_sala', numero_sala);
      return sala;
    } catch (error) {
      console.error(error);
      return 'Erro ao obter dados da sala.';
    }
  }

  public async createSala({ request }: HttpContextContract) {
    try {
      const corpoReq = request.only([
        'numero_sala',
        'disponibilidade',
        'capacidade_alunos',
        'matriculaAluno',
        'matriculaProfessor',
        'alunos_inscritos',
      ]);

      const capacidadeAlunos = parseInt(corpoReq.capacidade_alunos, 10);

      if (isNaN(capacidadeAlunos) || capacidadeAlunos <= 0) {
        return 'Capacidade de alunos inválida';
      }

      const professor = await Professor.findBy('matricula', corpoReq.matriculaProfessor);

      if (!professor) {
        return 'Professor não encontrado';
      }

      const sala = await Sala.create({
        numero_sala: corpoReq.numero_sala,
        capacidade_alunos: capacidadeAlunos,
        alunos_inscritos: corpoReq.alunos_inscritos,
        professor_criador: professor.nome,
        disponibilidade: corpoReq.disponibilidade,
      });

      if (corpoReq.matriculaAluno) {
        const matriculasAlunos = corpoReq.matriculaAluno.split(',');
        const alunosParaAdicionar = await Aluno.query().whereIn('matricula', matriculasAlunos).exec();

        if (alunosParaAdicionar.length > sala.capacidade_alunos) {
          return 'Quantidade de alunos excede a capacidade da sala.';
        } else if (alunosParaAdicionar.length === sala.capacidade_alunos) {
          sala.merge({ disponibilidade: 'indisponivel' });
          await sala.save();
        }

        await sala.related('alunos').attach(alunosParaAdicionar.map((aluno) => aluno.id));

        const nomesDosAlunos = alunosParaAdicionar.map((aluno) => aluno.nome);
        const nomesComoString = nomesDosAlunos.join(', ');

        sala.merge({ alunos_inscritos: nomesComoString });
        sala.save();
      }

      await sala.related('professores').attach([professor.id]);

      return {
        id: sala.id,
        numero_sala: sala.numero_sala,
        alunos_inscritos: sala.alunos_inscritos,
        capacidade_alunos: sala.capacidade_alunos,
        disponibilidade: sala.disponibilidade,
        professor_criador: sala.professor_criador,
        created_at: sala.createdAt,
        updated_at: sala.updatedAt,
      };
    } catch (error) {
      console.error(error);
      if (error.code === 'SQLITE_CONSTRAINT') {
        return 'Número da sala indisponível';
      }

      return 'Erro ao criar a sala';
    }
  }

  public async obterNomesAlunos({ params }: HttpContextContract) {
    try {
      const numeroSala = params.numero_sala;

      const sala = await Sala.query()
        .preload('alunos', (query) => query.select(['nome', 'email', 'matricula']))
        .where('numero_sala', numeroSala)
        .firstOrFail();

      return sala.alunos;
    } catch (error) {
      console.error(error);
      return 'Erro ao obter nomes dos alunos';
    }
  }

  public async removerAlunos({ request }: HttpContextContract) {
    try {
      const { numero_sala, matriculaAluno, matriculaProfessor } = request.only([
        'numero_sala',
        'matriculaAluno',
        'matriculaProfessor',
      ]);

      const professor = await Professor.findBy('matricula', matriculaProfessor);

      if (!professor) {
        return 'Professor não encontrado';
      }

      const sala = await Sala.query().preload('alunos').where('numero_sala', numero_sala).firstOrFail();

      if (!sala) {
        return 'Sala não encontrada';
      }

      if (sala.professor_criador !== professor.nome) {
        return 'Professor criador não correspondente à sala';
      }

      const matriculasAlunosRemover = matriculaAluno.split(',');
      const alunosParaRemover = sala.alunos.filter((aluno) => matriculasAlunosRemover.includes(aluno.matricula));

      const alunosNaoEncontrados = matriculasAlunosRemover.filter(
        (matricula) => !alunosParaRemover.some((aluno) => aluno.matricula === matricula)
      );

      if (alunosNaoEncontrados.length > 0) {
        return ` Aluno(s) de matrícula(s) "${alunosNaoEncontrados.join(', ')}" não inscrito(s) na sala.`;
      }

      await sala.related('alunos').detach(alunosParaRemover.map((aluno) => aluno.id));

      const nomesDosAlunosRestantes = sala.alunos
        .filter((aluno) => !matriculasAlunosRemover.includes(aluno.matricula))
        .map((aluno) => aluno.nome)
        .join(', ');

      sala.merge({ alunos_inscritos: nomesDosAlunosRestantes });

      if (sala.disponibilidade === 'indisponivel') {
        sala.disponibilidade = 'disponivel';
      }

      await sala.save();

      return {
        id: sala.id,
        numero_sala: sala.numero_sala,
        capacidade_alunos: sala.capacidade_alunos,
        disponibilidade: sala.disponibilidade,
        alunos_inscritos: nomesDosAlunosRestantes,
        professor_criador: sala.professor_criador,
        created_at: sala.createdAt,
        updated_at: sala.updatedAt,
      };
    } catch (error) {
      console.error(error);
      return 'Erro ao remover alunos da sala';
    }
  }

  public async destroy({ request }: HttpContextContract) {
    try {
      const { numero_sala, matricula } = request.only(['numero_sala', 'matricula']);
      const professor = await Professor.findBy('matricula', matricula);

      if (!professor) {
        return 'Professor não encontrado';
      }

      const sala = await Sala.findByOrFail('numero_sala', numero_sala);

      if (sala.professor_criador !== professor.nome) {
        return 'Professor criador não correspondente à sala';
      }

      await sala.delete();
      return 'Sala excluída com sucesso';
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return 'Sala não encontrada';
      }

      return 'Erro ao excluir a sala';
    }
  }

  public async editarCapacidade({ request }: HttpContextContract) {
    try {
      const { numero_sala, capacidade_alunos } = request.only(['numero_sala', 'capacidade_alunos']);
      const sala = await Sala.findByOrFail('numero_sala', numero_sala);

      const novaCapacidade = parseInt(capacidade_alunos, 10);

      if (isNaN(novaCapacidade) || novaCapacidade <= 0) {
        return 'Capacidade de alunos inválida';
      }

      const qAlunos_inscritos = sala.alunos_inscritos.split(',').filter(Boolean).length;

      if (novaCapacidade === qAlunos_inscritos) {
        sala.merge({ disponibilidade: 'indisponivel' });
      } else if (novaCapacidade > qAlunos_inscritos) {
        sala.merge({ disponibilidade: 'disponivel' });
      } else {
        return 'A capacidade não pode ser reduzida abaixo do número de alunos já inscritos';
      }

      sala.merge({ capacidade_alunos: novaCapacidade });
      await sala.save();

      return {
        id: sala.id,
        numero_sala: sala.numero_sala,
        capacidade_alunos: sala.capacidade_alunos,
        disponibilidade: sala.disponibilidade,
        alunos_inscritos: sala.alunos_inscritos,
        professor_criador: sala.professor_criador,
        created_at: sala.createdAt,
        updated_at: sala.updatedAt,
      };
    } catch (error) {
      console.error(error);

      if (error.code === 'E_ROW_NOT_FOUND') {
        return 'Sala não encontrada';
      }

      return 'Erro ao atualizar a sala';
    }
  }

  public async addAlunos({ request }: HttpContextContract) {
    try {
      const { numero_sala, matriculaAluno, matriculaProfessor } = request.only([
        'numero_sala',
        'matriculaAluno',
        'matriculaProfessor',
      ]);

      const professor = await Professor.findBy('matricula', matriculaProfessor);

      if (!professor) {
        return 'Professor não encontrado';
      }

      const salaN = await Sala.findBy('numero_sala', numero_sala);

      if (!salaN) {
        return 'Sala não encontrada';
      }

      if (salaN.professor_criador !== professor.nome) {
        return 'Professor criador não correspondente à sala';
      }

      if (salaN.disponibilidade === 'indisponivel') {
        return 'Sala indisponível';
      }

      const matriculasAlunos = matriculaAluno.split(',');

      const sala = await Sala.query()
        .preload('alunos', (query) => query.select(['matricula']))
        .where('numero_sala', numero_sala)
        .firstOrFail();

      const matriculasJaPresentes = sala.alunos.map((aluno) => aluno.matricula);
      const matriculasEncontradas = matriculasAlunos.filter((matriculaAluno) =>
        matriculasJaPresentes.includes(matriculaAluno)
      );

      const matriculasDuplicadas = matriculasAlunos.some(
        (matricula, index, array) => array.indexOf(matricula) !== index
      );

      if (matriculasDuplicadas) {
        return 'Matrículas duplicadas entre os novos alunos';
      }

      if (matriculasEncontradas.length > 0) {
        return `Aluno(s) que já está(ão) na sala: ${matriculasEncontradas.join(', ')}`;
      }

      const alunosInscritosAntigo = sala.alunos_inscritos;
      const alunosAntigos = alunosInscritosAntigo.split(',').filter(Boolean);
      const capacidadeRestante = sala.capacidade_alunos - alunosAntigos.length;

      if (matriculasAlunos.filter(Boolean).length > capacidadeRestante) {
        return 'Quantidade excede a capacidade da sala.';
      } else if (matriculasAlunos.filter(Boolean).length === capacidadeRestante) {
        sala.merge({ disponibilidade: 'indisponivel' });
        await sala.save();
        console.log('Capacidade da sala atingida.');
      }

      const alunosParaAdicionar = await Aluno.query().whereIn('matricula', matriculasAlunos).exec();

      await sala.related('alunos').attach(alunosParaAdicionar.map((aluno) => aluno.id));

      const nomesDosAlunos = alunosParaAdicionar.map((aluno) => aluno.nome);
      const nomesComoString = nomesDosAlunos.join(', ');

      const alunosInscritosAtualizado = alunosInscritosAntigo.concat(', ', nomesComoString);

      sala.merge({ alunos_inscritos: alunosInscritosAtualizado });
      await sala.save();

      return {
        id: sala.id,
        numero_sala: sala.numero_sala,
        capacidade_alunos: sala.capacidade_alunos,
        disponibilidade: sala.disponibilidade,
        alunos_inscritos: nomesComoString,
        professor_criador: sala.professor_criador,
        created_at: sala.createdAt,
        updated_at: sala.updatedAt,
      };
    } catch (error) {
      console.error(error);
      return 'Erro ao adicionar alunos à sala';
    }
  }
}
