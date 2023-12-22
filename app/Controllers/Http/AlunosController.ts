import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon';
import Aluno from 'App/Models/Aluno'
import Sala from 'App/Models/Sala'
import Database from '@ioc:Adonis/Lucid/Database'

export default class AlunosController {

  public async index({}: HttpContextContract) {
    const alunos = await Aluno.all()//query().select('*').where('tipo_usuario', 'aluno')

    return alunos
  }

  public async consultarPorMatriculaAluno({ request }: HttpContextContract) {
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
          return `nº ${sala.numero_sala} (Professor: '${professores}')`
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

  public async create({}: HttpContextContract) {}

  public async store({request}: HttpContextContract) {

     // Função para gerar matrícula a partir da data e hora atuais
function gerarMatricula(): string {
  const dataHoraAtual = DateTime.local().toFormat('yyyyMMddHHmmss');
  const aleatorio = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `alu${dataHoraAtual}${aleatorio}`;
}
    const matricula = gerarMatricula()

    const corpoReq = request.only(['matricula','nome' , 'email','data_nascimento', 'senha'  ])

    const userInfo = await Aluno.create({

      tipo_usuario: 'aluno',
      matricula: matricula,
      nome: corpoReq.nome,
      email: corpoReq.email,
      data_nascimento: corpoReq.data_nascimento,
      senha: corpoReq.senha,

    })

      console.log(userInfo.$isPersisted)

      return userInfo

  }

  public async show({ request }: HttpContextContract) {
    try {
    // Obtém a matrícula do corpo da requisição
    const matricula = request.input('matricula')

    // Busca o usuário pelo número da matrícula
    const user = await Aluno.findByOrFail('matricula', matricula)

    // Retorna o usuário encontrado
      return user

    } catch (error) {
       //Se ocorrer um erro, verifica se é devido ao usuário não ser encontrado
      if (error.code === 'E_ROW_NOT_FOUND') {
        return 'Usuário não encontrado'
      }

       //Outro erro desconhecido
      return 'Erro ao buscar o usuário'
    }
  }


  public async edit({}: HttpContextContract) {}

  public async update({ request }: HttpContextContract) {
    try {
      // Obtém a matrícula do corpo da requisição
      const matricula = request.input('matricula');

      // Busca o usuário pelo número da matrícula
      const aluno = await Aluno.findByOrFail('matricula', matricula);

      // Obtém os dados do corpo da requisição
      const corpoReq = request.only(['nome', 'email', 'data_nascimento', 'senha', 'matricula']);

      // Atualiza os campos do usuário com base nos dados da requisição
      aluno.merge(corpoReq);

      // Salva as alterações no banco de dados
      await aluno.save();

      return aluno.toJSON();
    } catch (error) {
      // Trate os erros aqui, por exemplo, usuário não encontrado
      return 'Erro ao atualizar os dados do aluno';
    }
  }


  public async destroy({ request }: HttpContextContract) {
    try {
      // Obtém a matrícula do corpo da requisição
      const matricula = request.input('matricula')

      // Busca o aluno pelo número da matrícula
      const aluno = await Aluno.findByOrFail('matricula', matricula)

      // Busca todas as salas em que o aluno está inscrito
      const salas = await aluno.related('salas').query()

      // Remover o aluno de cada sala
      await Promise.all(
        salas.map(async (sala) => {
          // Encontrar a associação específica do aluno na sala através da tabela pivot
          const alunoSala = await Database.from('aluno_sala')
            .where('sala_id', sala.id)
            .where('aluno_id', aluno.id)
            .first()

          // Remover a associação na tabela pivot
          if (alunoSala) {
            await Database.from('aluno_sala').where('id', alunoSala.id).delete()
          }

          // Atualizar a string de alunos_inscritos removendo o nome do aluno
          const alunosInscritosAtualizado = sala.alunos_inscritos
            .split(',')
            .filter((nome) => nome.trim() !== aluno.nome)
            .join(', ')

          sala.merge({ alunos_inscritos: alunosInscritosAtualizado })
          await sala.save()
        })
      )

      // Excluir o aluno
      await aluno.delete()

      return 'Usuário excluído com sucesso'
    } catch (error) {
      // Se ocorrer um erro, verifica se é devido ao aluno não ser encontrado
      if (error.code === 'E_ROW_NOT_FOUND') {
        return 'Aluno não encontrado'
      }

      // Outro erro desconhecido
      return 'Erro ao excluir o aluno'
    }
  }

}
