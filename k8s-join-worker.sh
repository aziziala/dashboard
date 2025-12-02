#!/bin/bash
# ==============================
# Kubernetes Worker Node Cleanup & Join
# ==============================

# ======= CONFIG =======
MASTER_IP="192.168.100.134"
TOKEN="8ve23e.sn8kb0n4cotpg04e"
CA_HASH="sha256:173a1bdc8dfe9619c84a879b14706f48e4e97a27e510d8a37411ae79d9032fb4"
# ======================

echo "Step 1: Reset previous Kubernetes state..."
sudo kubeadm reset -f

echo "Step 2: Clean leftover CNI and kubelet files..."
sudo rm -rf /etc/cni/net.d
sudo rm -rf /var/lib/cni/
sudo rm -rf /var/lib/kubelet/*
sudo rm -rf /etc/kubernetes/pki
sudo systemctl restart kubelet

echo "Step 3: Free Kubernetes-related ports if needed..."
for PORT in 10250 10259 10257 2379 2380 6443; do
    PIDS=$(sudo lsof -t -i:$PORT)
    if [ ! -z "$PIDS" ]; then
        echo "Killing processes on port $PORT: $PIDS"
        sudo kill -9 $PIDS
    fi
done

echo "Step 4: Join the worker node to the cluster..."
sudo kubeadm join $MASTER_IP:6443 --token $TOKEN --discovery-token-ca-cert-hash $CA_HASH

echo "✅ Worker node join script complete. Check status on master:"
echo "kubectl get nodes -o wide"
