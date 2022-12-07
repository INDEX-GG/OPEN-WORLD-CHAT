import { ErrorEmitFuncType } from './../types/types';
import {Server, Socket} from "socket.io";
import { findRooms, getSendMessage } from "./services";
import {RoomConnectType, PaginationType} from '../types/types';
import {checkUserAuth, confirmAdminSession, getAllRooms, getSendMessageAdmin, getUserRoomName} from './services';
import { errorMsg } from "../constants/error";


export const socketConnection = (io: Server) => {
    return async (socket: Socket) => {
        //? query body
        const querySocket = socket.handshake.query;
        const { userId, role, servicesId, customRoomName, email, password} = querySocket as unknown as RoomConnectType;
        const roomName = customRoomName || getUserRoomName(userId, servicesId);

        //? handle error emit
        const errorEmit: ErrorEmitFuncType = (msg: string) => {
            console.log(`user ${userId} - ${role} error: ${msg}`)
            io.in(roomName).emit("error", msg)
            socket.leave(roomName);
            socket.disconnect();
        }

        //! MAIN LOGIC
        try {

            console.log("------- new socket connection --------")

            //! forced disconnect
            if (!userId || !role) {
                errorEmit(errorMsg.error)
                return;
            }

            //! check role
            if (role === "admin" || role === "user") {

                //* USER
                if (role === "user") {
                    let isCreateRoom = true;
                    let roomId = undefined;
                    
                    //? query body
                    const { authToken, servicesId, services_name} = querySocket as unknown as RoomConnectType;


                    //? USER - CURRENT ROOM
                    socket.on("user connect room", async () => {
                        //! connect room user
                        await socket.join(roomName)
                        console.log(`${role}: ${userId} connected to room ${servicesId}`)

                        //! forced disconnect
                        if (!userId || !authToken || !role || !servicesId || !services_name) {
                            errorEmit(errorMsg.error)
                            return;
                        }

                        //! check verify
                        const isVerify = await checkUserAuth(authToken);

                        //! user not verify
                        if (!isVerify) {
                            console.log("user not verify")
                            errorEmit(errorMsg.auth)
                            return;
                        }

                        //! user verify
                        console.log("user verify")
                        io.in(roomName).emit("user verify")

                        //! find all rooms
                        const room = await findRooms(io, userId, servicesId, roomName, errorEmit)

                        //! error find room in db
                        if (typeof room === "undefined") {
                            console.log("room is find error")
                            errorEmit(errorMsg.room)
                            return;
                        };


                        //! room is find
                        if (room?.id) {
                            console.log("room is find")
                            roomId = room.id;
                            isCreateRoom = false;
                        }

                        //! create new room
                        if (room === true) {
                            console.log("room is find, create")
                            io.in(roomName).emit("new room");
                        }

                        //! send message
                        socket.on(
                            "send message", 
                            getSendMessage(
                                io, 
                                errorEmit, 
                                isCreateRoom, 
                                querySocket as any, 
                                roomName, 
                                room
                            )
                        )
                     })
                    //? USER - CURRENT ROOM
                }

                //* ADMIN
                if (role === "admin") {


                    //? ADMIN - ALL ROOM
                    //! admin connect all rooms
                    socket.on("admin connect all rooms", () => {
                        socket.join(roomName)
                        console.log(`${role} connect ${roomName}`);
                    })
                    //? ADMIN - ALL ROOM
                    

                    //? ADMIN - CURRENT ROOM
                    //! admin connect to current room
                    socket.on("admin connect current rooms", () => {
                        socket.join(roomName)
                        console.log(`${role} connect ${roomName}`);
                    })
                    //? ADMIN - CURRENT ROOM


                    //! error body
                    if (!email || !password) {
                        errorEmit(errorMsg.error)
                        return;
                    }

                    //! check auth admin
                    const isConfirm = await confirmAdminSession(email, password);


                    //! error auth admin 
                    if (!isConfirm) {
                        errorEmit(errorMsg.auth);
                        return;
                    }

                    if (isConfirm) {
                        console.log("emit frontend");
                        io.to(roomName).emit("admin confirm")
                    }

                    //! all rooms
                    socket.on("pagination rooms", ({page, pageLimit}: PaginationType) => {
                        getAllRooms(io, errorEmit, page, pageLimit)
                    })

                    //! admin send message
                    socket.on("admin send message", getSendMessageAdmin(io, errorEmit))
                }

            } else {
                //! not correct role
                errorEmit(errorMsg.auth)
            }
            
            //! disconnect room
            socket.on("disconnect", () => {
                console.log(`${role} disconnect ${roomName}`);
                errorEmit(errorMsg.leave)
            });

        } catch (e) {
            errorEmit(errorMsg.error);
        }
    }
}
