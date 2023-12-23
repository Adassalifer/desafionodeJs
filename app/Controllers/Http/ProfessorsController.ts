// ProfessorsController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Professor from 'App/Models/Professor'
import Sala from 'App/Models/Sala'
import { DateTime } from 'luxon';

export default class ProfessorsController {
  public async index({}: HttpContextContract) {
    const professors = await Professor.query().preload('salas') // Carrega as salas relacionadas
    return professors
  }

  public async store({ request }: HttpContextContract) {
    //RF05
    // Função para gerar matrícula a partir da data e hora atuais
  function gerarMatricula(): string {
  const dataHoraAtual = DateTime.local().toFormat('yyyyMMddHHmmss');
  const aleatorio = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `pro${dataHoraAtual}${aleatorio}`
  }

    const matricula = gerarMatricula()

    const corpoReq = request.only(['matricula', 'nome', 'email', 'data_nascimento', 'senha'])

    const userInfo = await Professor.create({
      tipo_usuario: 'professor',
      matricula: matricula,
      nome: corpoReq.nome,
      email: corpoReq.email,
      data_nascimento: corpoReq.data_nascimento,
      senha: corpoReq.senha,
    })

    return userInfo
  }



  public async show({ request }: HttpContextContract) {
    try {
      const matricula = request.input('matricula')
      const user = await Professor.findByOrFail('matricula', matricula)

      return user
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return 'Usuário não encontrado'
      }
      return 'Erro ao buscar o usuário'
    }
  }

  public async update({ request }: HttpContextContract) {
    try {
      const matricula = request.input('matricula')
      const user = await Professor.findByOrFail('matricula', matricula)
      const corpoReq = request.only(['nome', 'email', 'data_nascimento', 'senha'])

      user.merge(corpoReq)
      await user.save()

      return user
    } catch (error) {
      return 'Erro ao atualizar o usuário'
    }
  }

  public async destroy({ request }: HttpContextContract) {
    //RF07
    try {
      const matricula = request.input('matricula')
      const user = await Professor.findByOrFail('matricula', matricula)
      await user.delete()

      return 'Usuário excluído com sucesso'
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return 'Usuário não encontrado'
      }

      return 'Erro ao excluir o usuário'
    }
  }

  public async consultarPorMatriculaProfessor({ request }: HttpContextContract) {
    try {
      // Obtém a matrícula do corpo da requisição
      const matricula = request.input('matricula')

      // Busca o professor pelo número da matrícula com as salas relacionadas carregadas
      const professor = await Professor.query().where('matricula', matricula).preload('salas').firstOrFail()

      // Retorna os dados do professor incluindo as informações das salas
      return {
        id: professor.id,
        matricula: professor.matricula,
        tipo_usuario: professor.tipo_usuario,
        nome: professor.nome,
        email: professor.email,
        data_nascimento: professor.data_nascimento,
        created_at: professor.createdAt,
        updated_at: professor.updatedAt,
        salas: professor.salas.map((sala) => ({
          numero_sala: sala.numero_sala,
          capacidade_alunos: sala.capacidade_alunos,
          alunos_inscritos: sala.alunos_inscritos,
          disponibilidade: sala.disponibilidade,
        })),
      }
    } catch (error) {
      // Se ocorrer um erro, verifica se é devido ao professor não ser encontrado
      if (error.code === 'E_ROW_NOT_FOUND') {
        return 'Professor não encontrado'
      }

      // Outro erro desconhecido
      return 'Erro ao consultar o professor'
    }
  }
}
