import config from "../../config";
import { UserDefinition, UserModel } from "./UserModel"
import bcrypt from "bcryptjs";

let counter = 0;

const getCounter = () => {
  counter += 1;

  return counter;
}

type Fields = Pick<UserDefinition, Exclude<keyof UserDefinition, "_id">>

export const createUser = (fields?: DeepPartial<Fields>) => {
  const index = getCounter();

  const plainTextPassword = fields?.password ?? "password";

  const password = bcrypt.hashSync(plainTextPassword, config.jwt.saltRounds);
  const username = fields?.username ?? `user#${index}`;

  return new UserModel({ password, username }).save();
}