// migration professor_sala.ts
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ProfessorSala extends BaseSchema {
  protected tableName = 'professor_sala'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unique()
      table.integer('professor_id').unsigned().references('professors.id').onDelete('CASCADE')
      table.integer('sala_id').unsigned().references('salas.id').onDelete('CASCADE')
      table.timestamps(true, true)
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
