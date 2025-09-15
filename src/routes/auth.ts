import { Router, Request, Response, NextFunction } from 'express'
import { models } from '../db'
import { getReturnError } from '../utils/routeHelpers'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getErrorMsgMissingParams } from '../utils/validation'
import { ERROR_400_UKNOWN } from '../constants/statusCodeMessages'

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
      message: 'User registered successfully',
      data: {
        token,
        user: JSON.stringify(newUser)
      }
    })
  } catch(e) {
    console.error(`[ERROR] /auth/register: ${e}`)
    return _res.status(500).json({
      error: ERROR_400_UKNOWN
    })
  }
})

export default router
