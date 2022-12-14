import { styled } from "@mui/material";

const MainSC = styled("main")`
  width: 100%;
  flex-grow: 1;
  padding: 20px 35px 5px;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
  position: relative;
  & > *:last-child {
    margin-bottom: 0;
  }
`;

export const useChatMessagesStyles = () => ({
  MainSC,
});
