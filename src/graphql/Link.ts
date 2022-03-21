import { Prisma } from '@prisma/client';
import {
  arg,
  enumType,
  extendType,
  inputObjectType,
  intArg,
  list,
  nonNull,
  objectType,
  stringArg,
} from 'nexus';

export const Sort = enumType({
  name: 'Sort',
  members: ['asc', 'desc'],
});

export const LinkOrderByInput = inputObjectType({
  name: 'LinkOrderByInput',
  definition(t) {
    t.field('description', { type: Sort });
    t.field('url', { type: Sort });
    t.field('createdAt', { type: Sort });
  },
});

export const Link = objectType({
  name: 'Link',
  definition(t) {
    t.nonNull.int('id');
    t.nonNull.string('description');
    t.nonNull.string('url');
    // @ts-ignore
    t.nonNull.dateTime('createdAt');
    t.field('postedBy', {
      type: 'User',
      resolve(parent, args, context) {
        return context.prisma.link
          .findUnique({ where: { id: parent.id } })
          .postedBy();
      },
    });
    t.nonNull.list.nonNull.field('voters', {
      type: 'User',
      resolve(parent, args, context) {
        return context.prisma.link
          .findUnique({ where: { id: parent.id } })
          .voters();
      },
    });
  },
});

export const Feed = objectType({
  name: 'Feed',
  definition(t) {
    t.nonNull.list.nonNull.field('links', { type: Link });
    t.nonNull.int('count');
  },
});

export const LinkQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.field('feed', {
      type: 'Feed',
      args: {
        filter: stringArg(),
        skip: intArg(),
        take: intArg(),
        orderBy: arg({ type: list(nonNull(LinkOrderByInput)) }),
      },
      // @ts-ignore
      async resolve(parent, args, context, info) {
        const { prisma } = context;
        const { filter } = args;
        const where = filter
          ? {
              OR: [
                { description: { contains: filter } },
                { url: { contains: filter } },
              ],
            }
          : {};

        const links = await prisma.link.findMany({
          where,
          skip: args?.skip as number,
          take: args?.take as number,
          orderBy:
            args?.orderBy as Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput>,
        });

        const count = await prisma.link.count({ where });
        return { links, count };
      },
    });
  },
});

export const LinkMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('updateLink', {
      type: 'Link',
      args: {
        id: nonNull(intArg()),
        url: stringArg(),
        description: stringArg(),
      },
      async resolve(parent, args, context, info) {
        const { id, ...restargs } = args;
        const { prisma, userId } = context;
        if (!userId) {
          throw new Error('Cannot post without logging in.');
        }
        try {
          const exists = await prisma.link.findUnique({
            where: { id },
          });
          if (!exists) {
            throw new Error('Link Does Not Exist');
          }
          return await prisma.link.update({
            where: {
              id: args.id,
            },
            data: {
              ...restargs,
            } as any,
          });
        } catch (err) {
          return err;
        }
      },
    }),
      t.field('deleteLink', {
        type: 'Int',
        args: {
          id: nonNull(intArg()),
        },
        async resolve(parent, args, context, info) {
          const { id } = args;
          const { prisma, userId } = context;
          if (!userId) {
            throw new Error('Cannot post without logging in.');
          }

          const deletedLink = await prisma.link.delete({
            where: { id },
          });

          return 200;
        },
      }),
      t.nonNull.field('post', {
        type: 'Link',
        args: {
          url: nonNull(stringArg()),
          description: nonNull(stringArg()),
        },
        async resolve(parent, args, context, info) {
          const { url, description } = args;
          const { prisma, userId } = context;
          if (!userId) {
            throw new Error('Cannot post without logging in.');
          }

          if (url.length < 4) {
            throw new Error(
              JSON.stringify({
                field: 'url',
                error: 'must be atleast length of 3',
              }),
            );
          }
          if (description.length < 4) {
            throw new Error(
              JSON.stringify({
                field: 'description',
                error: 'must be atleast length of 3',
              }),
            );
          }

          const link = await prisma.link.create({
            data: {
              url,
              description,
              postedBy: { connect: { id: userId } },
            },
          });

          return link;
        },
      });
  },
});
