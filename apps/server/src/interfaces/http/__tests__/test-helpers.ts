export const createNoopDb = () => {
  const chain = {
    from: () => chain,
    innerJoin: () => chain,
    where: () => chain,
    orderBy: async () => [],
    limit: async () => [],
  }

  return {
    select: () => chain,
  }
}
