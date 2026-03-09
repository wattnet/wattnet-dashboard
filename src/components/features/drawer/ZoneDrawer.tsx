"use client";

import Drawer from "@mui/material/Drawer";
import { Box, IconButton, styled, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface ZoneDrawerProps {
  open: boolean;
  onClose: () => void;
  zoneName?: string;
}

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

export default function ZoneDrawer({
  open,
  onClose,
  zoneName,
}: ZoneDrawerProps) {
  return (
    <Drawer variant="persistent" anchor="right" open={open} onClose={onClose}>
      <DrawerHeader sx={{ mt: 8 }}>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DrawerHeader>
      <Box sx={{ width: 300, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Zone Info
        </Typography>
        <Typography variant="body1">
          {zoneName ? `Selected zone: ${zoneName}` : "No zone selected"}
        </Typography>
      </Box>
    </Drawer>
  );
}
