import { Router, Request, Response, NextFunction } from 'express'
import { models } from '../db'
import { getReturnError } from '../utils/routeHelpers'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getErrorMsgMissingParams } from '../utils/validation'
import { ERROR_401_INVALID_CREDENTIALS, ERROR_500_UKNOWN, SUCCESS_200_LOGIN_SUCCESSFULL, SUCCESS_201_REGISTRATION_SUCCESSFULL } from '../constants/statusCodeMessages'

const router = Router()

const { User } = models

router.post('/register', async (_req: Request, _res: Response, _next: NextFunction): Promise<any> => {
  const reqBody = _req.body
  const { email, password, role, age, nickName, name, surname } = reqBody

  const invalidVarsOrNull = getErrorMsgMissingParams(reqBody)
  if (invalidVarsOrNull !== null) {
    return getReturnError(_res, invalidVarsOrNull)
  }

  try {
    const user = await User.findOne({ where: { email }})
    if (user) {
      return _res.status(409).json({ error: 'User already exists' })
    }

    const hashedPasswd = await bcrypt.hash(password, 10)

    const newUser = await User.create({
      email,
      password: hashedPasswd,
      role,
      age,
      nickName,
      name,
      surname
    })

    const token = jwt.sign(
      { id: newUser.id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d'}
    )

    return _res.status(201).json({
      message: SUCCESS_201_REGISTRATION_SUCCESSFULL,
      data: {
        token,
        user: JSON.stringify(newUser)
      }
    })
  } catch(e) {
    console.error(`[ERROR] /auth/register: ${e}`)
    return _res.status(500).json({
      error: ERROR_500_UKNOWN
    })
  }
})

router.post('/login', async(_req: Request, _res: Response, _next: NextFunction): Promise<any> => {
  const invalidParamsOrNull = getErrorMsgMissingParams(_req.body)
  if (invalidParamsOrNull !== null) {
    return getReturnError(_res, invalidParamsOrNull)
  }

  const { email, password } = _req.body

  try {
    const user = await User.findOne({ where: { email }})
    if (!user) {
      return _res.status(401).json({
        error: ERROR_401_INVALID_CREDENTIALS // attacker shouldnt be able to enumerate existing emails
      })
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password)

    if (!isPasswordCorrect) {
      return _res.status(401).json({
        error: ERROR_401_INVALID_CREDENTIALS
      })
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d'}
    )

    return _res.status(200).json({
      message: SUCCESS_200_LOGIN_SUCCESSFULL,
      data: {
        token
      }
    })
  } catch(e) {
    console.error(`[ERROR] /auth/login : ${e}`)
    return _res.status(500).json({
      error: ERROR_500_UKNOWN
    })
  }
})

export default router
