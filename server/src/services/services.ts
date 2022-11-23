import { Server } from 'socket.io';
import {UserTokensAll, UserTokensBlackList} from "../models/ModelsMain";
import { IMessageModel } from "../types/IMessageModel";
import { User, Room, Message } from "../models/ModelsChat";
import { RoomConnectType } from '../types/types';

const checkUserAuth = async (role: string, roomId: number, authToken: string) => {
    try {
        //! find authToken in all refresh tokens
        const findTokenAll = await UserTokensAll.findOne({where: {token: authToken}});
        if (typeof findTokenAll?.dataValues === "object") {
            //! get token id
            const {dataValues: {id: tokenId}} = findTokenAll;
            //! find token in blacklist
            const findBlackListToken = await UserTokensBlackList.findOne({where: {token_id: tokenId}})
            //? null = true; object = false;
            return !findBlackListToken
        }
        return false;
    } catch (e) {
        return false;
    }
}

const createRoom = async (io: Server, connectData: RoomConnectType, data: IMessageModel, tryCount = 0) => {
    try {
        const { userInfo } = data;
        //! create user
        const user = await User.create({
            id: userInfo.id,
            name: userInfo.name || "",
            lastname: userInfo.lastname || "",
            patronymic: userInfo.patronymic || "",
            email: userInfo.email,
            phone: userInfo.phone || "",
        })
        console.log("user create");
        await user.save();
        //! create room
        const room = await Room.create({
            id: connectData.roomId,
            servicesId: connectData.servicesId,
            servicesName: connectData.services_name,
            userId: userInfo.id,
            adminId: 1,
        });
        console.log("room create");
        await room.save()
        return true;
    } catch(e) {
        tryCount += 1;
        //! try create
        if (tryCount > 0 && tryCount  <= 5) {
            createRoom(io, connectData, data, tryCount);
        } else {
            //! error create room
            io.emit("error", "Ошибка создания комнаты, пожайлуста перезайдите в аккаунт");
            return false;
        }
    }
}

const createMessage = async (io: Server, data: IMessageModel) => {
    try {
        const message = await Message.create({
            text: data.message,
            senderId: data.userInfo.id,
            roomId: data.userInfo.id,
        })
        await message.save();

        delete message.dataValues.updatedAt;
        //! emit frontend
        io.emit("message save", message.dataValues);
        return true;
    } catch(e) {
        console.log(e);
        io.emit("error", "Ошибка отправки сообщения, пожайлуста перезайдите в аккаунт");
        return false;
    }
}


//? event send message
const getSendMessage = (io: Server, connectData: RoomConnectType, isCreateRoom: boolean) => {
    return async (data: Omit<IMessageModel, "roomId">) => {
        //! get room data
        const getRoomData = (): IMessageModel => ({roomId: connectData.roomId, ...data})

        //! Main logic
        try {
            if (data.userInfo.id) {
                //! If room not found room
                if (isCreateRoom) {
                    //! create new room;
                    const roomData = getRoomData();
                    createRoom(io, connectData, roomData).then(() => {
                        isCreateRoom = false,
                        createMessage(io, roomData);
                    })
                } else {
                    //! create message
                    createMessage(io, getRoomData());
                }
            }
        } catch(e) {
            console.log(e);
            io.emit("error", "Ошибка отправки сообщения, пожайлуста перезайдите в аккаунт")
        }
    }
}

export {
    checkUserAuth,
    getSendMessage,
}
