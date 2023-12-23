import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { DateTime } from 'luxon';
import Aluno from 'App/Models/Aluno';
import Database from '@ioc:Adonis/Lucid/Database';

export default class AlunosController {

  public async index({}: HttpContextContract) {
    const alunos = await Aluno.all();
    return alunos;
  }

  public async mostrarNomeSalaProfessorPorMatriculaAluno({ params }: HttpContextContract) {
    try {
      const matricula = params.matricula;
      const aluno = await Aluno.findByOrFail('matricula', matricula);
      const salas = await aluno.related('salas').query().preload('professores');

      const respostaFormatada = {
        nome: aluno.nome,
        salas: salas.map((sala) => {
          const professores = sala.professores.map((professor) => professor.nome).join(', ');
          return `nº ${sala.numero_sala} (Professor: '${professores}')`;
        }),
      };

      return respostaFormatada;
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return 'Aluno não encontrado';
      }
      return 'Erro ao consultar o aluno';
    }
  }

  public async consultarDadosDoAlunoPorMatricula({ params }: HttpContextContract) {
    try {
      const matricula = params.matricula;
      const aluno = await Aluno.findByOrFail('matricula', matricula);
      const salas = await aluno.related('salas').query().preload('professores');

      const respostaFormatada = {
        aluno: {
          id: aluno.id,
          matricula: aluno.matricula,
          tipo_usuario: aluno.tipo_usuario,
          nome: aluno.nome,
          email: aluno.email,
          data_nascimento: aluno.data_nascimento,
          created_at: aluno.createdAt,
          updated_at: aluno.updatedAt,
        },
        salas: salas.map((sala) => {
          const professores = sala.professores.map((professor) => professor.nome).join(', ');
          return `nº ${sala.numero_sala} (Professor: '${professores}')`;
        }),
      };

      return respostaFormatada;
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return 'Aluno não encontrado';
      }
      return 'Erro ao consultar o aluno';
    }
  }

  public async store({ request }: HttpContextContract) {
    function gerarMatricula(): string {
      const dataHoraAtual = DateTime.local().toFormat('yyyyMMddHHmmss');
      const aleatorio = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `alu${dataHoraAtual}${aleatorio}`;
    }

    const matricula = gerarMatricula();
    const corpoReq = request.only(['matricula', 'nome', 'email', 'data_nascimento', 'senha']);

    const userInfo = await Aluno.create({
      tipo_usuario: 'aluno',
      matricula: matricula,
      nome: corpoReq.nome,
      email: corpoReq.email,
      data_nascimento: corpoReq.data_nascimento,
      senha: corpoReq.senha,
    });

    console.log(userInfo.$isPersisted);

    return userInfo;
  }

  public async update({ request }: HttpContextContract) {
    try {
      const matricula = request.input('matricula');
      const aluno = await Aluno.findByOrFail('matricula', matricula);
      const corpoReq = request.only(['nome', 'email', 'data_nascimento', 'senha', 'matricula']);

      aluno.merge(corpoReq);
      await aluno.save();

      return aluno.toJSON();
    } catch (error) {
      return 'Erro ao atualizar os dados do aluno';
    }
  }

  public async destroy({ request }: HttpContextContract) {
    try {
      const matricula = request.input('matricula');
      const aluno = await Aluno.findByOrFail('matricula', matricula);
      const salas = await aluno.related('salas').query();

      await Promise.all(
        salas.map(async (sala) => {
          const alunoSala = await Database.from('aluno_sala')
            .where('sala_id', sala.id)
            .where('aluno_id', aluno.id)
            .first();

          if (alunoSala) {
            await Database.from('aluno_sala').where('id', alunoSala.id).delete();
          }

          const alunosInscritosAtualizado = sala.alunos_inscritos
            .split(',')
            .filter((nome) => nome.trim() !== aluno.nome)
            .join(', ');

          sala.merge({ alunos_inscritos: alunosInscritosAtualizado });
          await sala.save();
        })
      );

      await aluno.delete();

      return 'Usuário excluído com sucesso';
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return 'Aluno não encontrado';
      }
      return 'Erro ao excluir o aluno';
    }
  }
}
