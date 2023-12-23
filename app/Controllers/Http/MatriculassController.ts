// SalasController.ts
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Sala from 'App/Models/Sala'
import Professor from 'App/Models/Professor'
import Aluno from 'App/Models/Aluno'

export default class MatriculassController {

    public async compararMatriculas({ request }: HttpContextContract) {
      try {

        const { matricula , numero_sala  } = request.only(['matricula', 'numero_sala'])

        // Divide a string de matriculas em um array de matrículas dos novos alunos
        const matriculasAlunos = matricula.split(',')

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

        if (matriculasEncontradas.length > 0) {
          return `Matrículas encontradas: ${matriculasEncontradas.join(', ')}`
        } else {
          return 'Nenhuma matrícula encontrada'
        }
      } catch (error) {
        console.error(error)
        return 'Erro ao obter nomes dos alunos'
      }
    }
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
}
