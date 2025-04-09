import { Route } from "next";

export const ITEM_PER_PAGE = 5;

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  "/admin(.*)": ["admin"],
  "/handler(.*)": ["admin", "handler"],
  "/breeder(.*)": ["breeder"],
  "/list/handler": ["admin", "handler"],
  "/list/breeder": ["admin", "breeder"],
  "/list/events": ["admin", "handler"],
  "/list/schedules": ["admin", "handler", "breeder"],
  "/list/vaccines": ["admin", "handler"],
  "/list/gamefowls": ["admin", "handler", "breeder"],
};
