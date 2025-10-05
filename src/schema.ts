import { gql } from "graphql-tag";

export const typeDefs = gql`
  type User {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    gender: Gender
    coverId: String
    coverUrl: String
    coverBlurDataURL: String
    phone: String
    status: String
    address: String
    city: String
    zip: String
    country: String
    state: String
    about: String
    isVerified: Boolean!
    otp: String
    commission: Float
    role: Role!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Mutation {
    registerUser(email: String!, password: String!): AuthPayload!
    loginUser(email: String!, password: String!): AuthPayload!
    forgetPassword(email: String!): Boolean!
    resetPassword(email: String!, newPassword: String!, otp: String!): Boolean!
    verifyOtp(otp: String!): Boolean!
    resendOtp: Boolean!
  }

  type Query {
    me: User
  }
`;
