# ���@�i����d�l�j


## �ϐ�

�����^�ƕ�����^�̒P���ϐ��i�X�J���j����єz�񂪗��p�\�ł��B�ϐ��ɂ͌^������܂��B�ϐ��̐錾���Ɍ^�𖾎����邩�A�������ɂ��ԐړI�Ɍ^���w�肷��K�v������܂��B

```
var n : number;  // �����^�̒P���ϐ�
var k = foo() + 1; // foo()�͐�����Ԃ��֐��Ƃ���ƁAk �������^�̕ϐ��ƂȂ�
var s : string;  // ������^�̕ϐ�
var s = "I have a pen!";   // �������ς݂̔z��^�ϐ�
var a1 : number[];  // �����^�̔z��ϐ�
var a2 : number[] = new Array();   // ����BTypeScript�Ƃ��Ă����삳���������͂��̋L�q�Ƃ���
var a3 : string[];  // ������̔z��ϐ�
var a4 : string[] = new Array();   // ����BTypeScript�Ƃ��Ă����삳���������͂��̋L�q�Ƃ���
```

���L�́A�ϐ��̏G�X�N���v�g�ƏG�ۃ}�N���̊֌W�������T���v���ł��B
�܂��́A�G�X�N���v�g

```
var k = 1;
var s = "foo";
var a1 : number[];
a1[1] = 5;
var a2 : string[];
a2[3] = "bar";
```

�G�ۃ}�N���ւ̃R���p�C�����ʂ͉��L�̒ʂ�B

```
#k=1;
$s="foo";
#a1[1]=5;
$a2[3]="bar";
```

## ��
