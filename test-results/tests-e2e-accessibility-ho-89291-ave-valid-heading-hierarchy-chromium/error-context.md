# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Skip to main content" [ref=e3] [cursor=pointer]:
    - /url: "#main-content"
  - main "Chat interface" [ref=e4]:
    - generic [ref=e12]:
      - generic [ref=e14]: Sign in to Open WebUI
      - generic [ref=e15]:
        - generic [ref=e16]:
          - generic [ref=e17]: Email
          - textbox "Email" [ref=e18]:
            - /placeholder: Enter Your Email
        - generic [ref=e19]:
          - generic [ref=e20]: Password
          - generic [ref=e21]:
            - generic [ref=e22]: Enter Your Password
            - textbox "Text Input" [ref=e23]:
              - /placeholder: Enter Your Password
            - button "Make password visible in the user interface" [ref=e24] [cursor=pointer]:
              - img [ref=e25]
      - generic [ref=e28]:
        - button "Sign in" [ref=e29] [cursor=pointer]
        - generic [ref=e30]:
          - text: Don't have an account?
          - button "Sign up" [ref=e31] [cursor=pointer]
  - generic [ref=e35]: Open WebUI
```