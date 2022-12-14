import sequelize from "../db/dbMain";
import { DataTypes }  from "sequelize";

export const UserTokensAll = sequelize.define("token_blacklist_outstandingtoken", {
    id: {type: DataTypes.BIGINT, primaryKey: true},
    token: {type: DataTypes.STRING},
    created_at: {type: DataTypes.DATE},
    expires_at: {type: DataTypes.DATE},
    jti: {type: DataTypes.STRING},
}, {tableName: "token_blacklist_outstandingtoken", timestamps: false})

export const UserTokensBlackList = sequelize.define("token_blacklist_blacklistedtoken", {
    id: {type: DataTypes.BIGINT, primaryKey: true},
    blacklisted_at: {type: DataTypes.DATE},
    token_id: {type: DataTypes.INTEGER},
}, {tableName: "token_blacklist_blacklistedtoken", timestamps: false})
