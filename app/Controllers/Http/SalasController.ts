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


  public async createSala({ request }: HttpContextContract) {
    try {
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
        capacidade_alunos: capacidadeAlunos, // Utiliza a capacidade definida na requisição
        alunos_inscritos: corpoReq.alunos_inscritos,
        professor_criador: professor.nome,
        disponibilidade: corpoReq.disponibilidade,
      })

      // Verifica se existem alunos a serem adicionados

      // Divide a string de matriculasAlunos em um array de matrículas
      const matriculasAlunos = corpoReq.matriculaAluno.split(',')

      // Busca os alunos pelos números das matrículas
      const alunosParaAdicionar = await Aluno.query().whereIn('matricula', matriculasAlunos).exec()

      // Verifica se a quantidade de alunos a serem adicionados não excede a capacidade da sala
      if (alunosParaAdicionar.length > sala.capacidade_alunos) {

        return 'Quantidade de alunos excede a capacidade da sala.'
      }else if (alunosParaAdicionar.length == sala.capacidade_alunos){
     // Se lotar, define a sala como indisponível e retorna mensagem
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

      // Associa o professor à sala
      await sala.related('professores').attach([professor.id])

      // Retorna as informações da sala incluindo o nome do aluno e do professor
      return {
        id: sala.id,
        numero_sala: sala.numero_sala,
        alunos_inscritos: nomesComoString,
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



    // Método para adicionar alunos à sala
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
        const sala = await Sala.findBy('numero_sala', numero_sala)

        // Verifica se a sala foi encontrada
        if (!sala) {
          return 'Sala não encontrada'
        }

        // Verifica se o professor criador corresponde ao da sala
        if (sala.professor_criador !== professor.nome) {
          return 'Professor criador não correspondente à sala'
        }

        // Verifica se a sala está disponível
        if (sala.disponibilidade === 'indisponivel') {
          return 'Sala indisponível'
        }

        // Divide a string de matriculasAlunos em um array de matrículas
        const matriculasAlunos = matriculaAluno.split(',')

        // Busca os alunos pelos números das matrículas
        const alunosParaAdicionar = await Aluno.query().whereIn('matricula', matriculasAlunos).exec()

        // Verifica se a quantidade de alunos a serem adicionados não excede a capacidade da sala
        const capacidadeRestante = sala.capacidade_alunos - (sala.alunos_inscritos || []).length
        if (alunosParaAdicionar.length > capacidadeRestante) {
          return 'Quantidade de alunos excede a capacidade disponível da sala'
        }

        // Associa a sala aos alunos encontrados
        await sala.related('alunos').attach(alunosParaAdicionar.map((aluno) => aluno.id))

        // Crie um array de nomes correspondentes
      const nomesDosAlunos = alunosParaAdicionar.map(aluno => aluno.nome)

      // Junte os nomes com vírgulas para formar uma string
      const nomesComoString = nomesDosAlunos.join(', ')

      sala.merge({ alunos_inscritos: nomesComoString })

      sala.save


        // Retorna as informações atualizadas da sala
        return {
          id: sala.id,
          numero_sala: sala.numero_sala,
          capacidade_alunos: sala.capacidade_alunos,
          disponibilidade: sala.disponibilidade,
          alunos_inscritos: sala.alunos ? sala.alunos.map((aluno) => ({ nome: aluno.nome })) : [],
          professor_criador: sala.professor_criador,
          created_at: sala.createdAt,
          updated_at: sala.updatedAt,
        }
      } catch (error) {
        console.error(error)
        return 'Erro ao adicionar alunos à sala'
      }
    }
    public async obterNomesAlunos({ params }: HttpContextContract) {
      try {
        // Obtém o número da sala dos parâmetros da requisição
        const numeroSala = params.numero_sala

        // Busca a sala pelo número da sala com a relação de alunos carregada
        const sala = await Sala.query().preload('alunos').where('numero_sala', numeroSala).firstOrFail()

        // Obtém os nomes dos alunos
        const nomesDosAlunos = sala.alunos.map((aluno) => aluno.nome).join(', ')

        // Retorna uma string com os nomes separados por vírgula
        return nomesDosAlunos
      } catch (error) {
        console.error(error)
        return 'Erro ao obter nomes dos alunos'
      }
    }

    public async consultarPorMatricula({ request }: HttpContextContract) {
      try {
        // Obtém a matrícula do corpo da requisição
        const matricula = request.input('matricula')

        // Busca o aluno pelo número da matrícula
        const aluno = await Aluno.findByOrFail('matricula', matricula)

        // Busca as salas em que o aluno está matriculado
        const salas = await aluno.related('salas').query().preload('professores')

        // Formata a resposta
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
            const professores = sala.professores.map((professor) => professor.nome).join(', ')
            return `${sala.numero_sala} (Professor : ${professores})`
          }),
        }

        return respostaFormatada
      } catch (error) {
        // Se ocorrer um erro, verifica se é devido ao aluno não ser encontrado
        if (error.code === 'E_ROW_NOT_FOUND') {
          return 'Aluno não encontrado'
        }

        // Outro erro desconhecido
        return 'Erro ao consultar o aluno'
      }
    }
}
