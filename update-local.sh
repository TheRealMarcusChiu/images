#! /bin/bash

ssh my-websites << EOF
  cd /root/images
  git pull
  systemctl restart images-admin.service
EOF

