import { createTheme } from '@mui/material/styles';
import { COLORS } from './colors';

export const muiTheme = createTheme({
  palette: {
    primary: {
      main: COLORS.primary,
    },
    secondary: {
      main: COLORS.secondary,
    },
    background: {
      default: '#f5f5f5',
    },
    text: {
      primary: '#111111',
      secondary: '#555555',
    },
  },
});
