---
layout: post
title: grpc hello world
author: Edison
date: 2021-03-08
---

### 获取源码
```
https://github.com/grpc/grpc-go.git
```
源码在 ```grpc-go/examples/helloworld```文件夹

### 源码解析
#### proto文件
- 声明使用proto3。这是最新版的格式，具体可以了解[proto3](https://developers.google.com/protocol-buffers/docs/proto3)与[proto2](https://developers.google.com/protocol-buffers/docs/proto)的区别。一般直接使用proto3即可。
```
syntax = "proto3";
```
- 声明包路径，指向了使用proto文件生成的包名。默认与被应用的go包一致，也可以使用该声明自主定义。
```
option go_package = "google.golang.org/grpc/examples/helloworld/helloworld";
```
- 声明生成java代码时的一些规则，在此处应该没什么用。
```
option java_multiple_files = true;
option java_package = "io.grpc.examples.helloworld";
option java_outer_classname = "HelloWorldProto";
```
- 声明应用的包名。
```
package helloworld;
```
- 声明服务调用接口。
```
// The greeting service definition.
service Greeter {
  // Sends a greeting
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}
```
- 消息体(message)定义。消息体是一个集成的结构，用于把各种参数集成到一个，类似于结构体。
```
// The request message containing the user's name.
message HelloRequest {
  string name = 1;
}
// The response message containing the greetings
message HelloReply {
  string message = 1;
}
```

#### server文件
- 头部声明。注意需要导入grpc包，同时需要把基于proto文件生成的包即```go_package```导入。
```
// Package main implements a server for Greeter service.
package main
import (
	"context"
	"log"
	"net"

	"google.golang.org/grpc"
	pb "google.golang.org/grpc/examples/helloworld/helloworld"
)
```
- 端口
```
const (
	port = ":50051"
)
```
- 获取pb包里生成的server，并编写接口业务逻辑
```
// server is used to implement helloworld.GreeterServer.
type server struct {
	pb.UnimplementedGreeterServer
}
// SayHello implements helloworld.GreeterServer
func (s *server) SayHello(ctx context.Context, in *pb.HelloRequest) (*pb.HelloReply, error) {
	log.Printf("Received: %v", in.GetName())
	return &pb.HelloReply{Message: "Hello " + in.GetName()}, nil
}
```
- main函数，启动服务。使用grpc创建server，并注册到pb包中。
```
func main() {
	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	pb.RegisterGreeterServer(s, &server{})
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
```

#### client文件
- 与server一样，导入相关包
```
// Package main implements a client for Greeter service.
package main
import (
	"context"
	"log"
	"os"
	"time"

	"google.golang.org/grpc"
	pb "google.golang.org/grpc/examples/helloworld/helloworld"
)
const (
	address     = "localhost:50051"
	defaultName = "world"
)
```
使用```pb.NewGreeterClient```创建client，并直接调用pb创建的service内接口```SayHello```.
```
func main() {
	// Set up a connection to the server.
	conn, err := grpc.Dial(address, grpc.WithInsecure(), grpc.WithBlock())
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()
	c := pb.NewGreeterClient(conn)
	// Contact the server and print out its response.
	name := defaultName
	if len(os.Args) > 1 {
		name = os.Args[1]
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	r, err := c.SayHello(ctx, &pb.HelloRequest{Name: name})
	if err != nil {
		log.Fatalf("could not greet: %v", err)
	}
	log.Printf("Greeting: %s", r.GetMessage())
}
```

### 总结

使用grpc犹如餐厅里的厨房窗口(service)，服务员将菜单小票(request message)递进窗口，厨房做好菜后将菜(reply message)再送出来。   

我们只需要再一开始将厨房窗口设计好，一个完整的做菜流就定义完成。后续只需要增加厨师和菜色，以满足不同的菜的需求即可。

### 参考
[proto3 语法](https://developers.google.com/protocol-buffers/docs/proto3)
[基于go的教程](https://developers.google.com/protocol-buffers/docs/gotutorial)
