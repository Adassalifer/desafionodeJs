import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Aluno from 'App/Models/Aluno'

export default class AchaAlunoPelaMatriculasController {




      // Método para encontrar os nomes dos alunos a partir das matrículas
public async findNomesByMatriculas({ request }: HttpContextContract) {
  try {
    const corpoReq = request.only(['matriculaAluno'])

    // Verifica se existem alunos a serem adicionados
    if (corpoReq.matriculaAluno) {
      // Divide a string de matriculasAlunos em um array de matrículas
      const matriculasAlunos = corpoReq.matriculaAluno.split(',')

      // Busca os alunos pelos números das matrículas
      const alunos = await Aluno.query().whereIn('matricula', matriculasAlunos).exec()

      // Crie um array de nomes correspondentes
      const nomesDosAlunos = alunos.map(aluno => aluno.nome)

      // Junte os nomes com vírgulas para formar uma string
      const nomesComoString = nomesDosAlunos.join(', ')

      return nomesComoString
    }

    return 'Nenhuma matrícula fornecida'
  } catch (error) {
    console.error(error)
    return 'Erro ao encontrar nomes dos alunos'
  }
}

}
