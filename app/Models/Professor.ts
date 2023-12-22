// model Professor.ts
import { DateTime } from 'luxon'
import { BaseModel, ManyToMany, column, manyToMany } from '@ioc:Adonis/Lucid/Orm'
import Sala from 'App/Models/Sala'

export default class Professor extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public matricula: string

  @column()
  public nome: string

  @column({
    serialize: (value) => value as 'aluno' | 'professor',
  })
  public tipo_usuario: 'aluno' | 'professor'

  @column()
  public email: string

  @column()
  public data_nascimento: Date

  @column({ serializeAs: null })
  public senha: string

  @manyToMany(() => Sala, {
    localKey: 'id',
    pivotForeignKey: 'professor_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'sala_id',
    pivotTable: 'professor_sala',
  })
  public salas: ManyToMany<typeof Sala>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
