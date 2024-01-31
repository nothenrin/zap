import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { MessageDocument, MessageModel } from "./MessageModel";
import { connectionDefinitions } from "graphql-relay";
import { UserType } from "../user/UserType";
import { RoomType } from "../room/RoomType";
import { RoomDocument } from "../room/RoomModel";
import { UserDocument } from "../user/UserModel";

export const MessageType = new GraphQLObjectType<MessageDocument>({
  name: 'Message',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (message) => message._id,
    },
    content: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (message) => message.content,
    },
    sender: {
      type: new GraphQLNonNull(UserType),
      resolve: async (message) => {
        // TODO: find a way to populate using loaders
        const messageModel = await MessageModel
          .findById(message._id)
          .populate<{ sender: UserDocument }>('sender')
          .exec();

        return messageModel?.sender;
      }
    },
    room: {
      type: new GraphQLNonNull(RoomType),
      resolve: async message => {
        // TODO: find a way to populate using loaders
        const messageModel = await MessageModel
          .findById(message._id)
          .populate<{ room: RoomDocument }>('room')
          .exec();

        return messageModel?.room;
      }
    },
    sentAt: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (message) => message.createdAt.toString(),
    }
  })
})

export const MessageConnection = connectionDefinitions({
  name: 'Message',
  nodeType: MessageType
})

export default MessageType;
