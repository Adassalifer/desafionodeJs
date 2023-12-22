// model Sala.ts
import { DateTime } from 'luxon'
import { BaseModel, ManyToMany, column, manyToMany } from '@ioc:Adonis/Lucid/Orm'
import Aluno from 'App/Models/Aluno'
import Professor from 'App/Models/Professor'

export default class Sala extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public numero_sala: number

  @column()
  public capacidade_alunos: number

  @column()
  public alunos_inscritos: string

  @column({
    serialize: (value) => value as 'disponivel' | 'indisponivel',
  })
  public disponibilidade: 'disponivel' | 'indisponivel'

  @column()
  public professor_criador: string

  @manyToMany(() => Aluno, {
    localKey: 'id',
    pivotForeignKey: 'sala_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'aluno_id',
    pivotTable: 'aluno_sala',
  })
  public alunos: ManyToMany<typeof Aluno>

  @manyToMany(() => Professor, {
    localKey: 'id',
    pivotForeignKey: 'sala_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'professor_id',
    pivotTable: 'professor_sala',
  })
  public professores: ManyToMany<typeof Professor>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
