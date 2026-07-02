#! /bin/bash

ssh my-websites << EOF
  cd /root/markive
  git pull
  systemctl restart markive-admin.service
EOF
