import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'alunos'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unique()
      table.string('matricula').unique()
      table.enum('tipo_usuario', ['aluno','professor']).notNullable()
      table.string('nome')
      table.string('email').unique()
      table.date('data_nascimento')
      table.string('senha', 8)
      table.timestamps(true, true)
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
