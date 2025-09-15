#!/usr/bin/env bun
import inquirer from 'inquirer'

const API_URL = 'http://localhost:8000/auth'

async function main() {
  try {
    const { operation } = await inquirer.prompt([
      {
        type: 'list',
        name: 'operation',
        message: 'What do you want to do?',
        choices: ['register', 'login']
      }
    ])

    let answers = {}
    if (operation === 'register') {
      answers = await inquirer.prompt([
        { type: 'input', name: 'email', message: 'Email:' },
        { type: 'password', name: 'password', message: 'Password:' },
        { type: 'input', name: 'role', message: 'Role:' },
        { type: 'number', name: 'age', message: 'Age:' },
        { type: 'input', name: 'nickName', message: 'Nickname:' },
        { type: 'input', name: 'name', message: 'First name:' },
        { type: 'input', name: 'surname', message: 'Surname:' }
      ])
    } else {
      answers = await inquirer.prompt([
        { type: 'input', name: 'email', message: 'Email:' },
        { type: 'password', name: 'password', message: 'Password:' }
      ])
    }

    const response = await fetch(`${API_URL}/${operation}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Error:', errorData)
    } else {
      const data = await response.json()
      console.log('✅ Success:', data)
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

main()
