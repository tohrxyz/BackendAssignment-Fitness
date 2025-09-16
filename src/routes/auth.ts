import { Router, Request, Response, NextFunction } from 'express'
import { models } from '../db'
import { getReturnError } from '../utils/routeHelpers'
import bcrypt from 'bcrypt'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { getErrorMsgMissingParams } from '../utils/validation'
import { ERROR_401_INVALID_CREDENTIALS, ERROR_500_UKNOWN, SUCCESS_200_LOGIN_SUCCESSFULL, SUCCESS_201_REGISTRATION_SUCCESSFULL } from '../constants/statusCodeMessages'
import { UserModel } from '../db/user'
import { ROLE } from '../utils/enums'

const router = Router()

const { User } = models

export type AuthedRequest = Request & { user?: UserModel }

export const authMiddleware = async (_req: AuthedRequest, _res: Response, _next: NextFunction): Promise<void> => {
  const token = _req.headers?.authorization?.split(' ')[1]

  if (!token) {
    _res.status(401).json({ error: 'No token provided'})
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY) as JwtPayload & { id: number }
    const user = await User.findOne({ where: { id: decoded.id }})

    if (!user) {
      _res.status(401).json({ error: 'User not found' })
      return
    }

    _req.user = user
    _next()
  } catch(e) {
    console.error(`[ERROR]: middleware auth: ${e}`)
    _res.status(403).json({ error: 'Invalid token' })
    return
  }
}

export const adminMiddleware = async (_req: AuthedRequest, _res: Response, _next: NextFunction): Promise<void> => {
  console.log("in admin middleware")
  if (!_req?.user) {
    _res.status(401).json({ error: "User not authenticated yet" })
    return
  }

  if (_req.user.role !== ROLE.ADMIN) {
    _res.status(401).json({ error: "Unauthorized access, only admin cas access this" })
    return
  }

  _next()
}


export const userMiddleware = async (_req: AuthedRequest, _res: Response, _next: NextFunction): Promise<void> => {
  if (!_req?.user) {
    _res.status(401).json({ error: "User not authenticated yet" })
    return
  }

  if (_req.user.role !== ROLE.USER) {
    _res.status(401).json({ error: "Unauthorized access, only user cas access this" })
    return
  }

  _next()
}

router.post('/register', async (_req: Request, _res: Response, _next: NextFunction): Promise<any> => {
  const reqBody = _req.body
  const { email, password, role, age, nickName, name, surname } = reqBody

  const invalidVarsOrNull = getErrorMsgMissingParams({
    email,
    password,
    role,
    age,
    nickName,
    name,
    surname
  })
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
        user: {
          email: newUser.email,
          name: newUser.name,
          surname: newUser.surname,
          nickName: newUser.nickName,
          age: newUser.age,
          role: newUser.role
        }
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
  const { email, password } = _req.body
  const invalidParamsOrNull = getErrorMsgMissingParams({ email, password })
  if (invalidParamsOrNull !== null) {
    return getReturnError(_res, invalidParamsOrNull)
  }

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
