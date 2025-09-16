import { DataTypes, Model, Sequelize } from "sequelize"

export interface CompletedExercise extends Model {
  id: number
  userId: number
  exerciseId: number
  duration: number
  completedAt: Date
}

export default (sequelize: Sequelize, modelName: string) => {
  const CompletedExerciseModelCtor = sequelize.define<CompletedExercise>(
    modelName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      exerciseId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      duration: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      }
    },
    {
      paranoid: true,
      timestamps: true,
      tableName: 'completedExercises'
    }
  )

  CompletedExerciseModelCtor.associate = (models) => {
    CompletedExerciseModelCtor.belongsTo(models.User, {
      foreignKey: 'userId'
    }),
    CompletedExerciseModelCtor.belongsTo(models.Exercise, {
      foreignKey: 'exerciseId'
    }),

    models.User.hasMany(models.CompletedExercise, {
      foreignKey: 'userId'
    }),
    models.Exercise.hasMany(models.CompletedExercise, {
      foreignKey: 'exerciseId'
    })
  }

  return CompletedExerciseModelCtor
}
