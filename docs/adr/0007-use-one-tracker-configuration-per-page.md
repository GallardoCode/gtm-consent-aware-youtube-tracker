# Use one tracker configuration per page

Support one stable tracker configuration per page in v1 so competing consent requirements and event settings cannot control the same iframe. Repeated executions reuse that configuration and update consent without creating duplicate players or listeners. Reject a later conflicting configuration with a diagnostic; changing consent values is a normal update, not a configuration conflict.
