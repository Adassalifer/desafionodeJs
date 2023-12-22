// migration aluno_sala.ts
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AlunoSala extends BaseSchema {
  protected tableName = 'aluno_sala'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unique()
      table.integer('aluno_id').unsigned().references('alunos.id').onDelete('CASCADE')
      table.integer('sala_id').unsigned().references('salas.id').onDelete('CASCADE')
      table.timestamps(true, true)
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
