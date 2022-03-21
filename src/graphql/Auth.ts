import { extendType, nonNull, objectType, stringArg } from 'nexus';

import argon from 'argon2';
import jwt from 'jsonwebtoken';
import { APP_SECRET } from '../constants';

export const authPayload = objectType({
  name: 'AuthPayload',
  definition(t) {
    t.nonNull.string('token');
    t.nonNull.field('user', {
      type: 'User',
    });
  },
});

export const AuthMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('signup', {
      type: 'AuthPayload',
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
        name: nonNull(stringArg()),
      },
      async resolve(parent, args, context, info) {
        const { email, name } = args;
        const password = await argon.hash(args.password);
        const user = await context.prisma.user.create({
          data: {
            email,
            name,
            password,
          },
        });
        const token = jwt.sign({ userId: user.id }, APP_SECRET!);
        return {
          token,
          user,
        };
      },
    });
    t.field('login', {
      type: 'AuthPayload',
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      async resolve(parent, args, context, info) {
        const user = await context.prisma.user.findUnique({
          where: { email: args.email },
        });

        if (!user) {
          throw new Error('No such user found');
        }

        const valid = await argon.verify(user.password, args.password);
        if (!valid) {
          throw new Error('Wrong Password');
        }
        const token = jwt.sign({ userId: user.id }, APP_SECRET!);

        return { token, user };
      },
    });
  },
});
