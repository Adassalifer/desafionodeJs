import Route from '@ioc:Adonis/Core/Route'


Route.get('/', async () => {
  return { hello: 'world' }
})

Route.group(() => {
  // Rotas para Professores
  Route.get('/professors', 'ProfessorsController.index')
  Route.post('/professors', 'ProfessorsController.store')
  Route.get('/professors/:matricula', 'ProfessorsController.show')
  Route.put('/professors/editar', 'ProfessorsController.update')
  Route.delete('/professors/:matricula', 'ProfessorsController.destroy')

  // Rota para criar uma sala associada a um professor
  Route.post('/professors/create-sala', 'ProfessorsController.createSala')

  Route.post('/salas/create-sala', 'SalasController.createSala')

  // Rota para adicionar alunos à sala
  Route.post('/salas/add-alunos', 'AddAlunoSalasController.addAlunos')

  // Rota para remover alunos da sala
  Route.post('/salas/remove-alunos', 'SalasController.removeAlunos')

  //acha aluno pela matricula

  Route.post('/acha-aluno-pela-matricula', 'AchaAlunoPelaMatriculasController.findNomesByMatriculas')




  // Rotas para Alunos
  Route.get('/alunos', 'AlunosController.index')
  Route.post('/alunos', 'AlunosController.store')
  Route.get('/alunos/:matricula', 'AlunosController.show')
  Route.put('/alunos/:matricula', 'AlunosController.update')
  Route.delete('/alunos/:matricula', 'AlunosController.destroy')

  // Rota para consultar dados do aluno por matrícula
Route.get('/consultar-aluno-sala', 'SalasController.consultarPorMatricula')


  // Rotas para Salas
  Route.get('/salas', 'SalasController.index')
  Route.post('/salas', 'SalasController.store')
  Route.post('/salas/adicionar-aluno', 'SalasController.inscreverAluno')
  Route.post('/salas/remover-aluno', 'RemoveAlunoSalasController.removerAlunos')


  // Crie a rota para o método obterNomesAlunos
Route.get('/salas/:numero_sala/alunos', 'SalasController.obterNomesAlunos')

})//.middleware(['auth']) // Adicione qualquer middleware necessário, como autenticação
