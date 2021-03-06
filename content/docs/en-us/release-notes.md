---
title: Release Notes
---
# Release Notes 2.5

<li class="mb-10"><b>Cluster Explorer:</b> New dashboard to provide a deeper look into clusters under management.
<ul>
  <li>Manage all Kubernetes cluster resources including custom resources from the Kubernetes operator ecosystem</li>
  <li>Deploy and manage Helm charts from our new Apps &amp; Marketplace</li>
  <li>View logs and interact with kubectl shell in a new IDE-like viewer</li>
</ul>
</li>
<li class="mb-10"><b>Monitoring and Alerting powered by Prometheus:</b> Allows management of custom Grafana dashboards and provide customization to AlertManager</li>
<li class="mb-10"><b>Logging powered by Banzai Cloud:</b> Customize FluentBit and Fluentd configurations and ship logs to a remote data store</li>
<li class="mb-10"><b>CIS Scans powered by kube-bench:</b> Extended support to perform CIS scans tailored for EKS and GKE platforms and perform a generic scan on any Kubernetes distribution</li>
<li class="mb-10"><b>Istio 1.7+:</b> Allows users to deploy multiple ingress and egress gateways</li>
<li class="mb-10">
<b>Rancher Continuous Delivery powered by Fleet:</b> Fleet is a built-in deployment tool for delivering applications and configurations from a Git source repository across multiple clusters.
<ul>
  <li>Deploy any Kubernetes resource defined by manifests, kustomize, or Helm</li>
  <li>Scale deployments to any number of clusters using a staged checkout and pull-based update model</li>
  <li>Organize clusters into groups for easier management</li>
  <li>Map Git source repositories to cluster group targets</li>
</ul>
</li>
<li class="mb-10">
<b>Enhanced EKS Lifecycle Management:</b>
<ul>
  <li>Provisioning has been enhanced to support managed node groups, private access, and control plane logging</li>
  <li>Registering existing EKS clusters allow management of upgrades and configuration</li>
</ul>
</li>
<li>
<b>Rancher Server Backups:</b>
<ul>
  <li>Back up Rancher server without access to the etcd database</li>
  <li>Restore data into any Kubernetes cluster</li>
</ul>
</li>
</ul>