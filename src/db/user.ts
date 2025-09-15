import { DataTypes, Model, Sequelize } from "sequelize";
import { ROLE } from "../utils/enums";

export interface UserModel extends Model {
  id: number
  name: string
  surname: string
  nickName: string
  email: string
  age: number
  role: ROLE
  password: string
}

export default (sequelize: Sequelize, modelName: string) => {
  const UserModelCtor = sequelize.define<UserModel>(
    modelName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      surname: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      nickName: {
        type: DataTypes.STRING(100),
        unique: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true
        }
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 13,
          max: 130,
          isInt: true
        }
      },
      role: {
        type: DataTypes.ENUM(...Object.values(ROLE)),
        allowNull: false,
        defaultValue: ROLE.USER
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true
        }
      }
    }, {
      tableName: 'users',
      timestamps: true,
      indexes: [
        { fields: ['email'] },
        { fields: ['role'] },
        { fields: ['createdAt'] },
        { fields: ['id', 'email'] }
      ]
    }
  )

  return UserModelCtor
}
