import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Sala from 'App/Models/Sala'
import Professor from 'App/Models/Professor'
//import Aluno from 'App/Models/Aluno'



export default class RemoveAlunoSalasController {
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
}


