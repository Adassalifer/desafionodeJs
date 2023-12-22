import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Sala from 'App/Models/Sala'
import Professor from 'App/Models/Professor'
import Aluno from 'App/Models/Aluno'

export default class AddAlunoSalasController {
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

        // Divide a string de matriculasAlunos em um array de matrículas dos novos alunos
        const matriculasAlunos = matriculaAluno.split(',')

        // Busca os novos alunos pelos números das matrículas
        const alunosParaAdicionar = await Aluno.query().whereIn('matricula', matriculasAlunos).exec()

        // Verifica a quantidade de alunos antigos
        const alunosInscritosAntigo = sala.alunos_inscritos;

        // Divide a string pelos caracteres de vírgula e filtra os elementos não vazios
        const alunosAntigos = alunosInscritosAntigo.split(',').filter(Boolean);

        // Obtém a quantidade de alunos antigos
        const qAlunosAntigos = alunosAntigos.length

        //Verifica quantos alunos ainda podem ser adicionados
        const capacidadeRestante = sala.capacidade_alunos - qAlunosAntigos

        if(matriculasAlunos.filter(Boolean).length > capacidadeRestante ){

          return 'Quantidade excede a capacidade da sala.'
        }else if(matriculasAlunos.filter(Boolean).length == capacidadeRestante){

          sala.merge({ disponibilidade: 'indisponivel' })
          await sala.save()
          console.log('Capacidade da sala atingida.')

        }

        // Associa a sala aos alunos encontrados para adicionar
        await sala.related('alunos').attach(alunosParaAdicionar.map((aluno) => aluno.id))

        // Crie um array de nomes correspondentes
         const nomesDosAlunos = alunosParaAdicionar.map(aluno => aluno.nome)

        // Junte os nomes com vírgulas para formar uma string dos alunos para adicionar
         const nomesComoString = nomesDosAlunos.join(', ')

        //Junte o string dos novos e dos antigos alunos
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

}
