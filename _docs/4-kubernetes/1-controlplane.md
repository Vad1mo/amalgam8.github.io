---
layout: page
title: Control Plane
permalink: /docs/kubernetes-integration-control-plane.html
redirect_from: /docs/kubernetes-integration/controlplane
category: Kubernetes Integration
order: 2
---

### Deploying Amalgam8 Control Plane

Amalgam8 rus a control-loop to validate routing rules stored in Third Party Resources (TPR)
 before they are fetched by the sidecars.
 The Kubernetes controller is deployed using the ReplicationController specification found in `cmd/k8srules/rc.yaml`:

```yaml
apiVersion: v1
kind: ReplicationController
metadata:
  name: rules
  labels:
    app: rules
spec:
  replicas: 1
  selector:
    app: rules
  template:
    metadata:
      name: rules
      labels:
        app: rules
    spec:
      containers:
        - name: rules
          image: amalgam8/a8-k8s-rules-controller:latest
          imagePullPolicy: IfNotPresent
          env:
            - name: K8S_NAMESPACE
              valueFrom:
                fieldRef:
                    fieldPath: metadata.namespace
```

To deploy:

```bash
$ kubectl create -f ./cmd/k8srules/rc.yaml
```

As part of its start-up sequence, the controller also registers the required extension resources into Kubernetes,
 if it isn't already registered.
 You may verify this by inspecting the pods and TPR's defined in the cluster:

```bash
$ kubectl get pods
NAME          READY     STATUS    RESTARTS   AGE
rules-btxsj   1/1       Running   0          2m
$ kubectl get thirdpartyresource
NAME                       DESCRIPTION                                    VERSION(S)
routing-rule.amalgam8.io   A specification of an Amalgam8 rule resource   v1
```


### Cleanup

To stop the control loop, run

```bash
$ kubectl delete -f ./cmd/k8srules/rc.yaml
```

Deleting the control loop will **not** automatically remove any rules or deregister the TPR.
These must be deleted manually.
