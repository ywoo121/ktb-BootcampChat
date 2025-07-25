// 2. frontend/pages/whiteboards/new.js
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ErrorCircleIcon, PdfIcon } from "@vapor-ui/icons";
import { Button, TextInput, Callout, Card, Text, Switch } from "@vapor-ui/core";
import { Stack, Box, Flex } from "../../components/ui/Layout";
import authService from "../../services/authService";

function NewWhiteboard() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    hasPassword: false,
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }
    setCurrentUser(user);
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("화이트보드 이름을 입력해주세요.");
      return;
    }

    if (formData.hasPassword && !formData.password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    if (!currentUser?.token) {
      setError("인증 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/whiteboards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": currentUser.token,
            "x-session-id": currentUser.sessionId,
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            password: formData.hasPassword ? formData.password : undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "화이트보드 생성에 실패했습니다.");
      }

      const { data } = await response.json();
      router.push(`/whiteboard?room=${data._id}`);
    } catch (error) {
      console.error("Whiteboard creation error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card.Root className="auth-card">
        <Card.Header>
          <Text typography="heading4">새 화이트보드</Text>
        </Card.Header>
        <Card.Body className="card-body">
          {error && (
            <Box style={{ marginBottom: "var(--vapor-space-400)" }}>
              <Callout color="danger">
                <Flex align="center" gap="200">
                  <ErrorCircleIcon size={16} />
                  <Text>{error}</Text>
                </Flex>
              </Callout>
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="300">
              <TextInput.Root
                type="text"
                value={formData.name}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, name: value }))
                }
                disabled={loading}
                placeholder="화이트보드 이름을 입력하세요"
              >
                <TextInput.Label>화이트보드 이름</TextInput.Label>
                <TextInput.Field
                  id="whiteboardName"
                  name="name"
                  placeholder="화이트보드 이름을 입력하세요"
                  style={{ width: "100%" }}
                />
              </TextInput.Root>

              <Switch.Root
                checked={formData.hasPassword}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    hasPassword: checked,
                    password: checked ? prev.password : "",
                  }))
                }
                disabled={loading}
              >
                <Switch.Label>비밀번호 설정</Switch.Label>
                <Switch.Control />
              </Switch.Root>

              {formData.hasPassword && (
                <TextInput.Root
                  type="password"
                  value={formData.password}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, password: value }))
                  }
                  disabled={loading}
                  placeholder="비밀번호를 입력하세요"
                >
                  <TextInput.Label>비밀번호</TextInput.Label>
                  <TextInput.Field
                    id="whiteboardPassword"
                    name="password"
                    placeholder="비밀번호를 입력하세요"
                    style={{ width: "100%" }}
                  />
                </TextInput.Root>
              )}

              <Button
                type="submit"
                color="primary"
                size="lg"
                stretch
                disabled={loading || !formData.name.trim()}
              >
                <PdfIcon size={16} />
                {loading ? "생성 중..." : "화이트보드 만들기"}
              </Button>
            </Stack>
          </form>
        </Card.Body>
      </Card.Root>
    </div>
  );
}

export default NewWhiteboard;
