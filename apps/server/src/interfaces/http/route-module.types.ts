import type { Router } from 'express'

export type ApiRouteModule = {
  readonly name: string
  readonly router: Router
}
