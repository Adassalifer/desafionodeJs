import Route from '@ioc:Adonis/Core/Route'


Route.get('/', async () => {
  return { hello: 'world' }
})

Route.group(() => {
  // Rotas para Professores
  Route.get('/professors', 'ProfessorsController.index')
  Route.post('/professors', 'ProfessorsController.store')
  Route.get('/professors/:matricula', 'ProfessorsController.show')
  Route.put('/professors/editar/:matricula', 'ProfessorsController.update')
  Route.delete('/professors/:matricula', 'ProfessorsController.destroy')

  //Consultar dados do professor pela matrícula
  Route.get('/professor/consultar', 'ProfessorsController.consultarPorMatriculaProfessor')

  //Criar Sala
  Route.post('/salas/criar', 'SalasController.createSala')

  // Rota para adicionar alunos à sala
  Route.post('/salas/adicionar-alunos', 'SalasController.addAlunos')

  // Rota para remover alunos da sala
  Route.post('/salas/remove-alunos', 'SalasController.removeAlunos')

  //Rota para excluir sala
  Route.delete('/salas/apagar-dados', 'SalasController.destroy')

  //acha aluno pela matricula

  Route.post('/acha-aluno-pela-matricula', 'AchaAlunoPelaMatriculasController.findNomesByMatriculas')




  // Rotas para Alunos
  Route.get('/alunos', 'AlunosController.index')
  Route.post('/alunos', 'AlunosController.store')
  Route.get('/alunos/:matricula', 'AlunosController.show')
  Route.put('/alunos/:matricula', 'AlunosController.update')
  Route.delete('/alunos/:matricula', 'AlunosController.destroy')

  // Rota para consultar dados do aluno por matrícula
Route.get('/aluno/consultar', 'AlunosController.consultarPorMatriculaAluno')


  // Rotas para Salas
  Route.get('/salas', 'SalasController.index')
  Route.post('/salas', 'SalasController.store')
  Route.post('/salas/adicionar-aluno', 'SalasController.inscreverAluno')
  Route.post('/salas/remover-aluno', 'RemoveAlunoSalasController.removerAlunos')


  // Crie a rota para o método obterNomesAlunos
Route.get('/consultar-alunos-sala/:numero_sala', 'SalasController.obterNomesAlunos')

})//.middleware(['auth']) // Adicione qualquer middleware necessário, como autenticação
