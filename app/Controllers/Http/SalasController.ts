// SalasController.ts
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Sala from 'App/Models/Sala'
import Professor from 'App/Models/Professor'
import Aluno from 'App/Models/Aluno'

export default class SalasController {
  public async index({}: HttpContextContract) {
    const salas = await Sala.query().preload('alunos').preload('professores') // Carrega alunos e professores relacionados
    return salas
  }

  public async obterDadosSala({ params }: HttpContextContract) {
    try {
      const numero_sala = params.numero_sala

      const sala = await Sala.findBy('numero_sala', numero_sala)

      return sala
    } catch (error) {
      console.error(error)
      return 'Erro ao obter dados da sala.'
    }
  }

  public async createSala({ request }: HttpContextContract) {
    //RF09
    try {
      //RF09
      // Criar sala
      const corpoReq = request.only(['numero_sala', 'disponibilidade', 'capacidade_alunos', 'matriculaAluno', 'matriculaProfessor', 'alunos_inscritos'])

      // Verifica se a capacidade de alunos é um número válido
      const capacidadeAlunos = parseInt(corpoReq.capacidade_alunos, 10)
      if (isNaN(capacidadeAlunos) || capacidadeAlunos <= 0) {
        return 'Capacidade de alunos inválida'
      }

      // Busca o professor pelo número da matrícula
      const professor = await Professor.findBy('matricula', corpoReq.matriculaProfessor)

      // Verifica se o professor foi encontrado
      if (!professor) {
        return 'Professor não encontrado'
      }

      // Cria a sala sem associar ao professor por enquanto
      const sala = await Sala.create({
        numero_sala: corpoReq.numero_sala,
        capacidade_alunos: capacidadeAlunos,
        alunos_inscritos: corpoReq.alunos_inscritos,
        professor_criador: professor.nome,
        disponibilidade: corpoReq.disponibilidade,
      })

      // Verifica se existem alunos a serem adicionados
      if (corpoReq.matriculaAluno) {
        // Divide a string de matriculasAlunos em um array de matrículas
        const matriculasAlunos = corpoReq.matriculaAluno.split(',')

        // Busca os alunos pelos números das matrículas
        const alunosParaAdicionar = await Aluno.query().whereIn('matricula', matriculasAlunos).exec()

        // Verifica se a quantidade de alunos a serem adicionados não excede a capacidade da sala
        if (alunosParaAdicionar.length > sala.capacidade_alunos) {
          return 'Quantidade de alunos excede a capacidade da sala.'
        } else if (alunosParaAdicionar.length === sala.capacidade_alunos) {
          // Se lotar, define a sala como indisponível
          sala.merge({ disponibilidade: 'indisponivel' })
          await sala.save()
        }

        // Associa a sala aos alunos encontrados
        await sala.related('alunos').attach(alunosParaAdicionar.map((aluno) => aluno.id))

        // Crie um array de nomes correspondentes
        const nomesDosAlunos = alunosParaAdicionar.map(aluno => aluno.nome)

        // Junte os nomes com vírgulas para formar uma string
        const nomesComoString = nomesDosAlunos.join(', ')

        sala.merge({ alunos_inscritos: nomesComoString })

        sala.save()
      }

      // Associa o professor à sala
      await sala.related('professores').attach([professor.id])

      // Retorna as informações da sala incluindo o nome do aluno e do professor
      return {
        id: sala.id,
        numero_sala: sala.numero_sala,
        alunos_inscritos: sala.alunos_inscritos,
        capacidade_alunos: sala.capacidade_alunos,
        disponibilidade: sala.disponibilidade,
        professor_criador: sala.professor_criador,
        created_at: sala.createdAt,
        updated_at: sala.updatedAt,
      }
    } catch (error) {
      console.error(error)
      if (error.code === 'SQLITE_CONSTRAINT') {
        return 'Número da sala indisponível'
      }

      return 'Erro ao criar a sala'
    }
    }
    public async obterNomesAlunos({ params }: HttpContextContract) {
      try {
        const numeroSala = params.numero_sala

        const sala = await Sala.query()
          .preload('alunos', (query) => query.select(['nome','email','matricula']))
          .where('numero_sala', numeroSala)
          .firstOrFail()

        return sala.alunos
      } catch (error) {
        console.error(error)
        return 'Erro ao obter nomes dos alunos'
      }
    }

    // Método para remover alunos da sala
    public async removerAlunos({ request }: HttpContextContract) {
      try {
        // Obter dados da requisição
        const { numero_sala, matriculaAluno, matriculaProfessor } = request.only(['numero_sala', 'matriculaAluno', 'matriculaProfessor'])

        // Buscar o professor pelo número da matrícula
        const professor = await Professor.findBy('matricula', matriculaProfessor)

        // Verificar se o professor foi encontrado
        if (!professor) {
          return 'Professor não encontrado'
        }

        // Busca a sala pelo número da sala com a relação de alunos carregada
        const sala = await Sala.query().preload('alunos').where('numero_sala', numero_sala).firstOrFail()

        // Verificar se a sala foi encontrada
        if (!sala) {
          return 'Sala não encontrada'
        }

        // Verificar se o professor criador corresponde ao da sala
        if (sala.professor_criador !== professor.nome) {
          return 'Professor criador não correspondente à sala'
        }

        // Dividir a string de matrículasAlunos em um array de matrículas dos alunos a serem removidos
        const matriculasAlunosRemover = matriculaAluno.split(',')

        // Filtrar os alunos da sala que precisam ser removidos
        const alunosParaRemover = sala.alunos.filter((aluno) => matriculasAlunosRemover.includes(aluno.matricula))

        // Verificar se todos os alunos a serem removidos estão presentes na sala
        const alunosNaoEncontrados = matriculasAlunosRemover.filter((matricula) => !alunosParaRemover.some((aluno) => aluno.matricula === matricula))
        if (alunosNaoEncontrados.length > 0) {
          return ` Aluno(s) de matrícula(s) "${alunosNaoEncontrados.join(', ')}" não inscrito(s) na sala.`
        }

        // Remover os alunos associados à sala
        await sala.related('alunos').detach(alunosParaRemover.map((aluno) => aluno.id))

        // Atualizar a string de alunos_inscritos removendo os nomes dos alunos removidos
        const nomesDosAlunosRestantes = sala.alunos
          .filter((aluno) => !matriculasAlunosRemover.includes(aluno.matricula))
          .map((aluno) => aluno.nome)
          .join(', ')

        sala.merge({ alunos_inscritos: nomesDosAlunosRestantes })

        // Verificar se a sala está disponível
        if (sala.disponibilidade === 'indisponivel') {
          sala.disponibilidade = 'disponivel'
        }

        await sala.save()

        // Retorna as informações atualizadas da sala após a remoção
        return {
          id: sala.id,
          numero_sala: sala.numero_sala,
          capacidade_alunos: sala.capacidade_alunos,
          disponibilidade: sala.disponibilidade,
          alunos_inscritos: nomesDosAlunosRestantes,
          professor_criador: sala.professor_criador,
          created_at: sala.createdAt,
          updated_at: sala.updatedAt,
        }
      } catch (error) {
        console.error(error)
        return 'Erro ao remover alunos da sala'
      }
    }

    public async destroy({ request }: HttpContextContract) {
      try {
        // Obtém o n° da sala e a matrícula do corpo da requisição
        const { numero_sala, matricula } = request.only(['numero_sala', 'matricula']);

        // Busca o professor pelo número da matrícula
        const professor = await Professor.findBy('matricula', matricula);

        // Verifica se o professor foi encontrado
        if (!professor) {
          return 'Professor não encontrado';
        }

        // Busca a sala pelo número da sala
        const sala = await Sala.findByOrFail('numero_sala', numero_sala);

        // Verifica se o professor criador corresponde ao da sala
        if (sala.professor_criador !== professor.nome) {
          return 'Professor criador não correspondente à sala';
        }

        // Excluir a sala
        await sala.delete();

        return 'Sala excluída com sucesso';
      } catch (error) {
        if (error.code === 'E_ROW_NOT_FOUND') {
          return 'Sala não encontrada';
        }

        // Outro erro desconhecido
        return 'Erro ao excluir a sala';
      }
    }
    // Método para modificar a capacidade da sala e disponibilidade
  public async editarCapacidade({ request }: HttpContextContract) {
    try {
      // Obtém os dados do corpo da requisição
      const { numero_sala, capacidade_alunos } = request.only(['numero_sala', 'capacidade_alunos'])

      // Busca a sala pelo número
      const sala = await Sala.findByOrFail('numero_sala', numero_sala)

      // Verifica se a capacidade_alunos é um número válido
      const novaCapacidade = parseInt(capacidade_alunos, 10)
      if (isNaN(novaCapacidade) || novaCapacidade <= 0) {
        return 'Capacidade de alunos inválida'
      }
      const qAlunos_inscritos = sala.alunos_inscritos.split(',').filter(Boolean).length;

      // Se a capacidade for reduzida até o número de alunos presentes, torne a sala indisponível
      if (novaCapacidade === qAlunos_inscritos) {
        sala.merge({ disponibilidade: 'indisponivel' })
          }else if(novaCapacidade > qAlunos_inscritos){
	      sala.merge({ disponibilidade: 'disponivel'})
	    }else{
        return 'A capacidade não pode ser reduzida abaixo do número de alunos já inscritos'
	    }

      // Atualiza a capacidade da sala
      sala.merge({ capacidade_alunos: novaCapacidade })


      // Salva as alterações
      await sala.save()

      // Retorna as informações atualizadas da sala
      return {
        id: sala.id,
        numero_sala: sala.numero_sala,
        capacidade_alunos: sala.capacidade_alunos,
        disponibilidade: sala.disponibilidade,
        alunos_inscritos: sala.alunos_inscritos,
        professor_criador: sala.professor_criador,
        created_at: sala.createdAt,
        updated_at: sala.updatedAt,
      }
    } catch (error) {
      console.error(error)

      // Trata os diferentes tipos de erro
      if (error.code === 'E_ROW_NOT_FOUND') {
        return 'Sala não encontrada'
      }

      return 'Erro ao atualizar a sala'
    }
  }



  //////////////////////////////////////////////////////////////////////////////////
  public async addAlunos({ request }: HttpContextContract) {
    try {
      // Adicionar alunos à sala
      const { numero_sala, matriculaAluno, matriculaProfessor } = request.only(['numero_sala', 'matriculaAluno', 'matriculaProfessor'])

      // Busca o professor pelo número da matrícula
      const professor = await Professor.findBy('matricula', matriculaProfessor)

      // Verifica se o professor foi encontrado
      if (!professor) {
        return 'Professor não encontrado'
      }

      // Busca a sala pelo número
      const salaN = await Sala.findBy('numero_sala', numero_sala)

      // Verifica se a sala foi encontrada
      if (!salaN) {
        return 'Sala não encontrada'
      }

      // Verifica se o professor criador corresponde ao da sala
      if (salaN.professor_criador !== professor.nome) {
        return 'Professor criador não correspondente à sala'
      }

      // Verifica se a sala está disponível
      if (salaN.disponibilidade === 'indisponivel') {
        return 'Sala indisponível'
      }

      // Divide a string de matriculasAlunos em um array de matrículas dos novos alunos
      const matriculasAlunos = matriculaAluno.split(',')

       // Consulta o banco de dados para obter as matrículas já presentes na sala
        const sala = await Sala.query()
          .preload('alunos', (query) => query.select(['matricula']))
          .where('numero_sala', numero_sala)
          .firstOrFail()

	// Obtém as matrículas dos alunos já presentes
        const matriculasJaPresentes = sala.alunos.map((aluno) => aluno.matricula)

        // Compara as matrículas dos novos alunos com as já presentes
        const matriculasEncontradas = matriculasAlunos.filter((matriculaAluno) =>
          matriculasJaPresentes.includes(matriculaAluno)
        )

        // Verificar se há matrículas duplicadas entre as novas matrículas
    const matriculasDuplicadas = matriculasAlunos.some((matricula, index, array) => array.indexOf(matricula) !== index)

    if (matriculasDuplicadas) {
      return 'Matrículas duplicadas entre os novos alunos'
    }


	if (matriculasEncontradas.length > 0) {
          return `Aluno(s) que já está(ão) na sala: ${matriculasEncontradas.join(', ')}`
        }

      // Verifica a quantidade de alunos antigos
      const alunosInscritosAntigo = sala.alunos_inscritos;
      const alunosAntigos = alunosInscritosAntigo.split(',').filter(Boolean);

      // Verifica quantos alunos ainda podem ser adicionados
      const capacidadeRestante = sala.capacidade_alunos - alunosAntigos.length;

      if (matriculasAlunos.filter(Boolean).length > capacidadeRestante) {
        return 'Quantidade excede a capacidade da sala.';
      } else if (matriculasAlunos.filter(Boolean).length === capacidadeRestante) {
        sala.merge({ disponibilidade: 'indisponivel' })
        await sala.save()
        console.log('Capacidade da sala atingida.')
      }

      // Busca os novos alunos pelos números das matrículas
      const alunosParaAdicionar = await Aluno.query().whereIn('matricula', matriculasAlunos).exec()

      // Associa a sala aos alunos encontrados para adicionar
      await sala.related('alunos').attach(alunosParaAdicionar.map((aluno) => aluno.id))

      // Crie um array de nomes correspondentes
      const nomesDosAlunos = alunosParaAdicionar.map(aluno => aluno.nome)

      // Junte os nomes com vírgulas para formar uma string dos alunos para adicionar
      const nomesComoString = nomesDosAlunos.join(', ')

      // Junte o string dos novos e dos antigos alunos
      const alunosInscritosAtualizado = alunosInscritosAntigo.concat(", " , nomesComoString)

      sala.merge({ alunos_inscritos: alunosInscritosAtualizado })
      await sala.save()

      // Retorna as informações atualizadas da sala
      return {
        id: sala.id,
        numero_sala: sala.numero_sala,
        capacidade_alunos: sala.capacidade_alunos,
        disponibilidade: sala.disponibilidade,
        alunos_inscritos: nomesComoString,
        professor_criador: sala.professor_criador,
        created_at: sala.createdAt,
        updated_at: sala.updatedAt,
      }
    } catch (error) {
      console.error(error)
      return 'Erro ao adicionar alunos à sala'
    }
  }
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
}
