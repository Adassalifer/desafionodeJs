import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'salas'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unique()
      table.integer('numero_sala').unique().notNullable()
      table.integer('capacidade_alunos').notNullable()
      table.enum('disponibilidade', ['disponivel','indisponivel']).notNullable()
      table.string('professor_criador')
      table.string('alunos_inscritos')
      table.timestamps(true, true)
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
