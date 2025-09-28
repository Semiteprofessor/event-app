/server
├─ prisma/
│ ├─ schema.prisma
│ └─ seed.ts
├─ src/
│ ├─ index.ts # bootstrap server
│ ├─ app.ts # createServer
│ ├─ context.ts # request context (user, prisma, loaders)
│ ├─ schema/
│ │ ├─ graphql.ts # nexus makeSchema
│ │ ├─ types/
│ │ │ ├─ User.ts
│ │ │ └─ Event.ts
│ │ └─ mutations/
│ ├─ modules/
│ │ ├─ auth/
│ │ │ ├─ auth.service.ts
│ │ │ └─ auth.resolver.ts
│ │ └─ event/
│ │ ├─ event.service.ts
│ │ └─ event.resolver.ts
│ ├─ lib/
│ │ ├─ jwt.ts
│ │ ├─ logger.ts
│ │ └─ errors.ts
│ └─ utils/
│ ├─ validators.ts
│ └─ loaders.ts
├─ tests/
│ ├─ e2e/
│ └─ unit/
├─ Dockerfile
├─ docker-compose.yml
├─ package.json
└─ tsconfig.json
