# terraform-documentation-links

This is a simple extension that add links to your editor when editing Terraform source files.

It adds links to resource and data blocks.

## Known Issues

This is a *dumb* extension. It simply scans for lines containing

```
data "data_type" "name" {
```

and 

```
resource "resource_type" "name" {
```

and adds link to the `data_type` and `resource_type` docs based on the type.
