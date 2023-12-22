# Sistema de Gerenciamento Escolar

Bem-vindo ao Sistema de Gerenciamento Escolar, um projeto open source desenvolvido em Node.js utilizando o framework AdonisJS. Este sistema permite a administração eficiente de alunos, professores e salas de aula, proporcionando uma experiência simplificada e robusta.

## Funcionalidades Principais

### Cadastro e Gerenciamento de Alunos
- **RF01:** Permitir que aluno se cadastre na aplicação
- **RF02:** Permitir que aluno edite seus dados de cadastro
- **RF03:** Permitir que aluno exclua seus dados de cadastro
- **RF04:** Permitir que aluno consulte seus dados de cadastro

### Cadastro e Gerenciamento de Professores
- **RF05:** Permitir que professor se cadastre na aplicação
- **RF06:** Permitir que professor edite seus dados de cadastro
- **RF07:** Permitir que professor exclua seus dados de cadastro
- **RF08:** Permitir que professor consulte seus dados de cadastro

### Administração de Salas de Aula
- **RF09:** Permitir que professor cadastre uma nova sala
- **RF10:** Permitir que professor edite os dados de uma sala
- **RF11:** Permitir que professor exclua os dados de uma sala
- **RF12:** Permitir que professor consulte os dados de uma sala

### Alocação e Consulta de Alunos em Salas
- **RF13:** Permitir que professor aloque um aluno em uma sala
- **RF14:** Permitir que professor remova o aluno de uma sala
- **RF15:** Permitir que professor consulte todos os alunos de uma sala
- **RF16:** Permitir que aluno consulte todas as salas que deverá comparecer

## Regras de Negócio
- **RN01 (RF01):** Deve ser coletado do aluno os seguintes dados: Nome, e-mail, matrícula, data de nascimento.
- **RN02 (RF05):** Deve ser coletado do professor os seguintes dados: Nome, e-mail, matrícula, data de nascimento.
- **RN03 (RF09):** Deve ser coletado da sala: Número da sala, capacidade de alunos, disponibilidade (Se pode alocar aluno ou não).
- **RN04 (RF13):** A sala não pode possuir o mesmo aluno mais de uma vez.
- **RN05 (RF13):** A sala não pode exceder sua capacidade de alunos.
- **RN06 (RF13):** O professor não poderá alocar um aluno para uma sala que não tenha sido criada por ele.

## Exigências e Desenvolvimento
- Um arquivo exportado em JSON (do Insomnia) com todas as rotas da aplicação.
- Desenvolva a API em Node.js, utilizando o AdonisJS (https://adonisjs.com).
- Entregue o link do GitHub com o projeto commitado.


**Desenvolvido por [Adassa jeanneffer]**

Contato: [adassamoda@gmail.com]

