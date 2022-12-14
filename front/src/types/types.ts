import { Socket } from "socket.io-client";

export type FetchRejectCallback = (error: Error) => void;

export enum SessionStorageEnum {
  EMAIL = "@email",
  PASSWORD = "@password",
}

export interface ICallback {
  successCallback: () => void;
  rejectCallback: FetchRejectCallback;
}

export interface IError {
  isError: boolean;
  message: string;
}

export type SocketType = Socket | null;

export interface ISocketProps {
  socketState: SocketType;
}

export type AdminNewMessageType = {
  roomId: number;
  userId: number;
  adminId: number;
  message: string;
  servicesId: number;
};
