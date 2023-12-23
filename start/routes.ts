import Route from '@ioc:Adonis/Core/Route'


Route.get('/', async () => {
  return { hello: 'world' }
})

Route.group(() => {

  // Rotas para Alunos
  Route.post('/alunos/cadastro', 'AlunosController.store') //RF01
  Route.put('/alunos/editar/:matricula', 'AlunosController.update')//RF02
  Route.delete('/alunos/apagar-dados', 'AlunosController.destroy')//RF03
  Route.get('/aluno/consultar-dados-por-matricula/:matricula', 'AlunosController.consultarDadosDoAlunoPorMatricula')//RF04
  Route.get('/alunos', 'AlunosController.index')//indice de alunos
  Route.get('/aluno/consultar-salas-professores-por-matricula/:matricula', 'AlunosController.mostrarNomeSalaProfessorPorMatriculaAluno')//RF16
  Route.get('/alunos/:matricula', 'AlunosController.show')//busca por matricula
  // Rotas para Professores
  Route.post('/professors', 'ProfessorsController.store')//RF05
  Route.put('/professors/editar/:matricula', 'ProfessorsController.update')//RF06
  Route.delete('/professors/:matricula', 'ProfessorsController.destroy')//RF07
  Route.get('/professor/consultar', 'ProfessorsController.consultarPorMatriculaProfessor')//RF08
  Route.get('/professors', 'ProfessorsController.index')//indice do professor
  // Rotas para Salas
  Route.post('/salas/criar', 'SalasController.createSala')//RF09
  Route.post('/salas/editar-capacidade', 'SalasController.editarCapacidade')//RF10
  Route.delete('/salas/apagar-dados', 'SalasController.destroy')//RF11
  Route.get('/salas/consultar-numero-sala/:numero_sala', 'SalasController.obterDadosSala')//RF12
  Route.post('/salas/adicionar-aluno/', 'SalasController.addAlunos')//RF13
  Route.post('/salas/remove-alunos', 'SalasController.removeAlunos')//RF14
  Route.get('/consultar-alunos-sala/:numero_sala', 'SalasController.obterNomesAlunos')//RF15













  // Rotas para Salas
  Route.get('/salas', 'SalasController.index')//indice da sala
  Route.post('/salas', 'SalasController.store')
  //Route.post('/salas/adicionar-aluno', 'SalasController.inscreverAluno')
  Route.post('/salas/remover-aluno', 'SalasController.removerAlunos')


  // Crie a rota para o método obterNomesAlunos


})//.middleware(['auth']) // Adicione qualquer middleware necessário, como autenticação
