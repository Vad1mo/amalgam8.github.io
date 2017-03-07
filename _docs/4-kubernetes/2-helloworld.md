---
layout: page
title: HelloWorld!
permalink: /docs/kubernetes-integration-helloworld.html
redirect_from: /docs/kubernetes-integration/helloworld
category: Kubernetes Integration
order: 3
---

Please refer to [helloworld](/docs/demo-helloworld.html) for a detailed description of the
 application and use case.

> Before attempting to run this sample, please read through the [prerequisites and caveats](/docs/kubernetes-integration-intro.html#prerequisites-caveats)

## Running the Hello World! Sample Application

1. Bring up the [control plane](/docs/kubernetes-integration-control-plane.html#deploy)

1. Bring up the application containers:

   ```bash
   $ kubectl create -f examples/k8s-helloworld.yaml
   ```

   The above command automatically launches the gateway service and two instances of each version of `helloworld`.
   Confirm that all services and pods are correctly defined and running:

   ```bash
    $ kubectl get services
    NAME         CLUSTER-IP   EXTERNAL-IP   PORT(S)          AGE
    controller   10.0.0.66    <nodes>       6080:31200/TCP   3m
    gateway      10.0.0.86    <nodes>       6379:32000/TCP   17s
    helloworld   None         <none>        5000/TCP         17s
   ```

   and

   ```bash
    $ kubectl get pods
    NAME                  READY     STATUS    RESTARTS   AGE
    controller-r48lr      1/1       Running   0          4m
    gateway-r28zf         1/1       Running   0          1m
    helloworld-v1-9f5h3   1/1       Running   0          1m
    helloworld-v1-z2l3z   1/1       Running   0          1m
    helloworld-v2-5cl2k   1/1       Running   0          1m
    helloworld-v2-zmdtk   1/1       Running   0          1m
   ```

   > **Note**: different application versions are deployed concurrently, via separate replica sets/replication controllers.
   > Shifting traffic between versions, for a rolling upgrade, will be done using Amalgam8 routing rules.
   >
   > Kubernetes supports rolling updates via `Deployment` resources, but these replace application pods "in-place" and
   > do not allow fine-grained control and application awareness in request steering (i.e., each instance receives
   > a proportional share of the connections, not individual requests, using random load-balancing).

1. Expose the Gateway service

   Determine the node on which the `gateway` pod runs, and use the node's IP address as the external gateway IP.

   ```bash
   $ kubectl describe pod gateway-4whg2 | grep Node
   Node:		node4.k8s.example.com/9.147.221.77
   $ export GATEWAY_URL=9.147.221.77:32000
   ```

   Since no default route is set, access to the helloworld endpoint on the gateway, may return a response from any
   instance, and issuing the curl command multiple times should load balance amongst all deployed instances.

   ```bash
   $ for i in {1..8}; do curl http://$GATEWAY_URL/helloworld/hello; done
   Hello version: v2, container: helloworld-v2-8dd8g
   Hello version: v2, container: helloworld-v2-jbh8l
   Hello version: v1, container: helloworld-v1-991qk
   Hello version: v1, container: helloworld-v1-9dwkp
   Hello version: v2, container: helloworld-v2-8dd8g
   Hello version: v1, container: helloworld-v1-9dwkp
   Hello version: v2, container: helloworld-v2-jbh8l
   Hello version: v1, container: helloworld-v1-991qk
   ```

### Version Based Routing  <a id="version-based-routing"></a>

1. Lets send all traffic to the v1 version of helloworld:

   ```bash
   $ a8ctl rule-create -f examples/helloworld-default-route-rules.json
   ```

1. We can confirm the rule is set by running the following command and confirming that `Status.state` is set to `valid`:

   ```bash
   $ kubectl get routingrule
    NAME                             KIND
    helloworld-default-route-rules   RoutingRule.v1.amalgam8.io
   $ kubectl get routingrule -o json
    {
        "apiVersion": "v1",
        "items": [
            {
                "apiVersion": "amalgam8.io/v1",
                "kind": "RoutingRule",
                "metadata": {
                    "creationTimestamp": "2017-03-07T17:55:15Z",
                    "name": "helloworld-default-route-rules",
                    "namespace": "default",
                    "resourceVersion": "1535",
                    "selfLink": "/apis/amalgam8.io/v1/namespaces/default/routingrules/helloworld-default-route-rules",
                    "uid": "381ba446-035f-11e7-80cc-080027c86dc2"
                },
                "spec": {
                    "destination": "helloworld",
                    "id": "helloworld-default-route-rules",
                    "priority": 1,
                    "route": {
                        "backends": [
                            {
                                "tags": [
                                    "version=v1"
                                ]
                            }
                        ]
                    }
                },
                "status": {
                    "state": "valid"
                }
            }
        ],
        "kind": "List",
        "metadata": {},
        "resourceVersion": "",
        "selfLink": ""
    }
   ```

1. Confirm that all traffic is being directed to the v1 instance, by running the following curl command multiple times.

   ```bash
   $ for i in {1..4}; do curl http://$GATEWAY_URL/helloworld/hello; done
   Hello version: version=v1, container: helloworld-v1-991qk
   Hello version: version=v1, container: helloworld-v1-991qk
   Hello version: version=v1, container: helloworld-v1-9dwkp
   Hello version: version=v1, container: helloworld-v1-9dwkp
   ```

   You can see that the traffic is continually routed between the v1 instances only, in a random fashion.

1. Next, we will split traffic between helloworld v2 (25%) and v1 (the remaining 75%)

   Run the following command to send 25% of the traffic to helloworld v2, leaving the rest (75%) on v1:

   ```bash
   $ a8ctl rule-delete -i helloworld-default-route-rules
   $ a8ctl create -f examples/helloworld-v1-v2-route-rules.yaml
   ```

   Since both rules refer to the same URL path, the priority of rule `set-helloworld-25p-v2` is set
   higher than the priority of `set-helloworld-default-v1`, to ensure it has precedence over the default route.
   Having rules with the same priority and path results in undefined behavior.
   Refer to [rule DSL](/docs/control-plane-controller-rules-dsl.html) for a more complete discussion of rule
   syntax and semantics.

1. Run this curl command several times:

   ```bash
   curl http://$GATEWAY_URL/helloworld/hello
   ```

   You will see alternating responses from all 4 helloworld instances, where approximately 1 out of every 4 (25%) responses
   will be from a "v2" instances, and the other responses from the "v1" instances:

   ```bash
   $ for i in {1..8}; do curl http://$GATEWAY_URL/helloworld/hello; done
   Hello version: version=v2, container: helloworld-v2-jbh8l
   Hello version: version=v2, container: helloworld-v2-jbh8l
   Hello version: version=v1, container: helloworld-v1-991qk
   Hello version: version=v1, container: helloworld-v1-9dwkp
   Hello version: version=v1, container: helloworld-v1-9dwkp
   Hello version: version=v2, container: helloworld-v2-8dd8g
   Hello version: version=v1, container: helloworld-v1-991qk
   Hello version: version=v1, container: helloworld-v1-9dwkp
   ```

   Note: if you use a browser instead of curl to access the service and continually refresh the page,
   it will always return the same version (v1 or v2), because a cookie is set to maintain version affinity.
   However, the browser still alternates in a random manner between instances of the specific version.

### Cleanup

1. Delete the routing rules

   ```bash
   $ a8ctl rule-delete -i helloworld-v1-v2-route-rules
   ```

1. Terminate the application pods

   ```bash
   $ kubectl delete -f examples/k8s-helloworld.yaml
   ```
   
1. Terminate the [control plane](/docs/kubernetes-integration-control-plane.html#cleanup)
